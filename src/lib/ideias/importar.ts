// Importação do repositório (src/data/repositorio-ideias.json). Função pura:
// valida o arquivo inteiro e devolve os registros prontos + um relatório de
// problemas; quem grava no banco é a ação do admin. Se houver QUALQUER erro, a
// ação não importa nada (melhor parar do que entrar com ficha quebrada).
import { z } from "zod";
import { categoriaValida } from "./categorias";
import {
  conteudoDoOriginal,
  conteudoSchema,
  fonteOriginalSchema,
  negocioOriginalSchema,
  type ConteudoIdeia,
  type FonteOriginal,
} from "./conteudo";

// "Importar 5 de teste": a primeira ideia de cinco categorias diferentes.
export const ORDENS_DO_TESTE = [1, 16, 31, 46, 61];

const repositorioSchema = z.object({
  negocios: z.array(z.unknown()),
  fontes: z.array(fonteOriginalSchema),
});

export type IdeiaParaImportar = {
  origemId: string;
  slug: string;
  categoria: string;
  ordem: number;
  nome: string;
  resumo: string;
  // O negócio exatamente como veio, mais as fontes já resolvidas (id -> objeto).
  dados: Record<string, unknown>;
  conteudo: ConteudoIdeia;
};

export type RelatorioImportacao = {
  total: number;
  porCategoria: Record<string, number>;
  erros: string[];
  ideias: IdeiaParaImportar[];
};

export function prepararImportacao(bruto: unknown): RelatorioImportacao {
  const erros: string[] = [];
  const ideias: IdeiaParaImportar[] = [];
  const porCategoria: Record<string, number> = {};

  const repo = repositorioSchema.safeParse(bruto);
  if (!repo.success) {
    return { total: 0, porCategoria, erros: ["Arquivo fora do formato esperado (negocios/fontes)."], ideias };
  }

  const fontes = new Map<string, FonteOriginal>(repo.data.fontes.map((f) => [f.id, f]));
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const [i, item] of repo.data.negocios.entries()) {
    const r = negocioOriginalSchema.safeParse(item);
    const rotulo = (item as { id?: string } | null)?.id ?? `#${i + 1}`;
    if (!r.success) {
      erros.push(`${rotulo}: ${r.error.issues[0]?.path.join(".")} — ${r.error.issues[0]?.message}`);
      continue;
    }
    const n = r.data;
    if (ids.has(n.id)) erros.push(`${n.id}: id repetido`);
    if (slugs.has(n.slug)) erros.push(`${n.id}: slug repetido (${n.slug})`);
    ids.add(n.id);
    slugs.add(n.slug);
    if (!categoriaValida(n.categoria_id)) erros.push(`${n.id}: categoria desconhecida (${n.categoria_id})`);

    const resolvidas: FonteOriginal[] = [];
    for (const fid of n.fontes_ids) {
      const f = fontes.get(fid);
      if (f) resolvidas.push(f);
      else erros.push(`${n.id}: fonte inexistente (${fid})`);
    }

    const conteudo = conteudoDoOriginal(n);
    if (!conteudoSchema.safeParse(conteudo).success) erros.push(`${n.id}: conteúdo convertido inválido`);

    porCategoria[n.categoria_id] = (porCategoria[n.categoria_id] ?? 0) + 1;
    ideias.push({
      origemId: n.id,
      slug: n.slug,
      categoria: n.categoria_id,
      ordem: n.ordem_geral,
      nome: n.nome,
      resumo: n.resumo,
      dados: { ...(item as Record<string, unknown>), fontes: resolvidas },
      conteudo,
    });
  }

  return { total: ideias.length, porCategoria, erros, ideias };
}
