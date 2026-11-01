// Gera um lote de dicas novas com a IA (ver prompt.ts) e filtra o que não presta antes de gravar:
// formato errado, texto proibido e repetição de dicas que já existem.
import { z } from "zod";
import { openai, OPENAI_GENERATION_MODEL } from "@/lib/ai-engine/openai-client";
import { logAiUsage } from "@/lib/ai-engine/log-ai-usage";
import { IDS_DAS_CATEGORIAS } from "./categorias";
import { DICAS_SYSTEM_PROMPT } from "./prompt";
import { TAMANHO_DO_LOTE } from "./escolher";

export const dicaGeradaSchema = z.object({
  categoria: z.string(),
  titulo: z.string(),
  texto: z.string(),
  tente_hoje: z.string(),
  ideia: z.string().nullable(),
});

export const loteGeradoSchema = z.object({ dicas: z.array(dicaGeradaSchema) });

export type DicaGerada = z.infer<typeof dicaGeradaSchema>;

const JSON_SCHEMA = {
  type: "object",
  properties: {
    dicas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          categoria: { type: "string", enum: IDS_DAS_CATEGORIAS },
          titulo: { type: "string" },
          texto: { type: "string" },
          tente_hoje: { type: "string" },
          ideia: { type: ["string", "null"] },
        },
        required: ["categoria", "titulo", "texto", "tente_hoje", "ideia"],
        additionalProperties: false,
      },
    },
  },
  required: ["dicas"],
  additionalProperties: false,
} as const;

// --- Filtros (puros) -------------------------------------------------------------------------

const PROIBIDAS = [
  /[—–]/, // travessão
  /\b(garant\w+|ficar rico|enriquec\w+|dinheiro f[aá]cil|lucro certo|renda extra garantida)\b/i,
  /\b(depress\w+|ansiedade cl[ií]nica|transtorno|diagn[oó]stic\w+ m[eé]dic\w+|terapia|rem[eé]dio|medicament\w+)\b/i,
  /\b(largue o emprego|pe[cç]a demiss[aã]o|empr[eé]stimo|se endivide)\b/i,
  /\bnunca falha\b/i,
];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PALAVRAS_VAZIAS = new Set(["a", "o", "e", "de", "do", "da", "em", "um", "uma", "para", "que", "se", "com", "no", "na", "as", "os"]);

function palavras(texto: string): Set<string> {
  return new Set(
    normalizar(texto)
      .split(" ")
      .filter((p) => p.length > 2 && !PALAVRAS_VAZIAS.has(p)),
  );
}

// Parecido com uma dica que já existe? Título igual ou muitas palavras em comum no título e no texto.
export function pareceRepetida(nova: { titulo: string; texto: string }, existentes: { titulo: string; texto: string }[]): boolean {
  const tituloNovo = normalizar(nova.titulo);
  const pt = palavras(nova.titulo);
  const px = palavras(nova.texto);
  for (const e of existentes) {
    if (normalizar(e.titulo) === tituloNovo) return true;
    const jt = jaccard(pt, palavras(e.titulo));
    const jx = jaccard(px, palavras(e.texto));
    if (jt >= 0.7 || jx >= 0.6) return true;
  }
  return false;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let comuns = 0;
  for (const p of a) if (b.has(p)) comuns++;
  return comuns / (a.size + b.size - comuns);
}

export function motivoDeRecusa(d: DicaGerada): string | null {
  if (!IDS_DAS_CATEGORIAS.includes(d.categoria)) return "categoria desconhecida";
  const titulo = d.titulo.trim();
  const texto = d.texto.trim();
  const tente = d.tente_hoje.trim();
  if (titulo.length < 8 || titulo.length > 80) return "título fora do tamanho";
  if (texto.length < 80 || texto.length > 520) return "texto fora do tamanho";
  if (tente.length < 20 || tente.length > 280) return "tente hoje fora do tamanho";
  if (!/^se\s/i.test(tente) || !/,\s*ent[aã]o\s/i.test(tente)) return 'tente hoje fora do formato "Se..., então..."';
  const tudo = `${titulo} ${texto} ${tente} ${d.ideia ?? ""}`;
  if (PROIBIDAS.some((r) => r.test(tudo))) return "texto proibido";
  return null;
}

export type ResultadoDoFiltro = {
  aprovadas: { categoria: string; titulo: string; texto: string; tenteHoje: string; ideia: string | null }[];
  recusadas: { titulo: string; motivo: string }[];
};

export function filtrarDicasGeradas(
  geradas: DicaGerada[],
  existentes: { titulo: string; texto: string }[],
  maximo = TAMANHO_DO_LOTE,
): ResultadoDoFiltro {
  const aprovadas: ResultadoDoFiltro["aprovadas"] = [];
  const recusadas: ResultadoDoFiltro["recusadas"] = [];
  const acumuladas = [...existentes];

  for (const d of geradas) {
    const motivo = motivoDeRecusa(d) ?? (pareceRepetida(d, acumuladas) ? "repetida" : null);
    if (motivo) {
      recusadas.push({ titulo: d.titulo, motivo });
      continue;
    }
    const limpa = {
      categoria: d.categoria,
      titulo: d.titulo.trim().replace(/\.$/, ""),
      texto: d.texto.trim(),
      tenteHoje: d.tente_hoje.trim(),
      ideia: d.ideia?.trim() ? d.ideia.trim() : null,
    };
    aprovadas.push(limpa);
    acumuladas.push({ titulo: limpa.titulo, texto: limpa.texto });
  }
  return { aprovadas: equilibrarPorCategoria(aprovadas, maximo), recusadas };
}

// Fica com até `maximo` dicas, alternando entre as categorias (uma de cada por rodada), para o lote
// não ficar concentrado nos temas que a IA mais gosta e deixar um tema de fora.
export function equilibrarPorCategoria<T extends { categoria: string }>(dicas: T[], maximo: number): T[] {
  const filas = new Map<string, T[]>();
  for (const d of dicas) filas.set(d.categoria, [...(filas.get(d.categoria) ?? []), d]);
  const escolhidas: T[] = [];
  while (escolhidas.length < maximo && [...filas.values()].some((f) => f.length > 0)) {
    for (const fila of filas.values()) {
      const proxima = fila.shift();
      if (proxima && escolhidas.length < maximo) escolhidas.push(proxima);
    }
  }
  return escolhidas;
}

// --- Chamada à IA ----------------------------------------------------------------------------

export async function gerarLoteDeDicas(entrada: {
  existentes: { categoria: string; titulo: string }[];
  maisGuardadas: string[];
  maisDispensadas: string[];
  quantidade?: number;
}): Promise<DicaGerada[]> {
  const quantidade = entrada.quantidade ?? TAMANHO_DO_LOTE;
  // Pede um pouco mais do que o lote, porque o filtro descarta repetidas e fora de formato.
  const pedir = Math.ceil(quantidade * 1.3);

  const porCategoria = new Map<string, string[]>();
  for (const e of entrada.existentes) porCategoria.set(e.categoria, [...(porCategoria.get(e.categoria) ?? []), e.titulo]);
  const jaExistem = IDS_DAS_CATEGORIAS.map(
    (id) => `${id}: ${(porCategoria.get(id) ?? []).join(" | ") || "(nenhuma)"}`,
  ).join("\n");

  const mensagem = `Escreva ${pedir} dicas novas.

DICAS QUE JÁ EXISTEM (por categoria; não repita título nem ideia):
${jaExistem}

AS MAIS GUARDADAS PELAS PESSOAS (faça mais nessa linha): ${entrada.maisGuardadas.join(" | ") || "(ainda sem dados)"}
AS MAIS DISPENSADAS (evite esse estilo): ${entrada.maisDispensadas.join(" | ") || "(ainda sem dados)"}`;

  const completion = await openai.chat.completions.create({
    model: OPENAI_GENERATION_MODEL,
    max_completion_tokens: 16000,
    messages: [
      { role: "system", content: DICAS_SYSTEM_PROMPT },
      { role: "user", content: mensagem },
    ],
    response_format: { type: "json_schema", json_schema: { name: "lote_de_dicas", strict: true, schema: JSON_SCHEMA } },
  });
  await logAiUsage("gerar-dicas", OPENAI_GENERATION_MODEL, completion.usage);

  const conteudo = completion.choices[0]?.message?.content;
  if (!conteudo) throw new Error("Resposta da OpenAI (lote de dicas) não contém texto.");
  return loteGeradoSchema.parse(JSON.parse(conteudo)).dicas;
}
