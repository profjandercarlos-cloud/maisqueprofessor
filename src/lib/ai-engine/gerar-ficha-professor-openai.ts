import { openai, OPENAI_GENERATION_MODEL } from "./openai-client";
import { GERAR_FICHA_PROFESSOR_SYSTEM_PROMPT } from "./gerar-ficha-professor-prompt";
import { logAiUsage } from "./log-ai-usage";
import { comLinhaMei, fichaSchema, FICHA_VERSAO, type FichaProfessor } from "@/lib/negocios/ficha";

// Mesmo modelo do resto do motor ("Sol", ver openai-client.ts), por decisão do
// dono do produto: qualidade da ficha acima de custo e velocidade.
const FICHA_MODEL = OPENAI_GENERATION_MODEL;

const str = { type: "string" } as const;
const strNull = { type: ["string", "null"] } as const;
const strList = { type: "array", items: str } as const;

const JSON_SCHEMA = {
  type: "object",
  properties: {
    versao: { type: "integer", enum: [FICHA_VERSAO] },
    vende: str,
    paraQuem: str,
    quando: str,
    porque: strList,
    preco: {
      type: "object",
      properties: { referencia: str, aviso: strNull, sugestao: str, estimativa: { type: "boolean" }, conta: strNull },
      required: ["referencia", "aviso", "sugestao", "estimativa", "conta"],
      additionalProperties: false,
    },
    preparar: strList,
    comeco: {
      type: "object",
      properties: { fazer: str, cliente: str, depois: str },
      required: ["fazer", "cliente", "depois"],
      additionalProperties: false,
    },
    cresce: {
      type: "object",
      properties: { c0: str, c1: str, c5: str, alem: str },
      required: ["c0", "c1", "c5", "alem"],
      additionalProperties: false,
    },
    cuidados: strList,
    amostraPlano: {
      type: "object",
      properties: { titulo: str, tarefa: str, feitoQuando: str },
      required: ["titulo", "tarefa", "feitoQuando"],
      additionalProperties: false,
    },
  },
  required: ["versao", "vende", "paraQuem", "quando", "porque", "preco", "preparar", "comeco", "cresce", "cuidados", "amostraPlano"],
  additionalProperties: false,
} as const;

// O registro inteiro, menos o que é só de auditoria interna.
export type NegocioParaFicha = {
  codigo: string;
  nome: string;
  posicionamento: string;
  oQueOClienteRecebe: string;
  compradorPersona: string;
  gatilhoDeCompra: string;
  clientePagaParaResolver: string;
  modeloDeReceita: string;
  faixaDePreco: unknown;
  comoCresce: string;
  riscoEstrutural: string;
  exigenciasLegais: string | null;
  tagOnde: string;
  tagPreparo: string;
  tagInvestimentoInicial: string;
  habilidadesDoProfessor: string[];
  relacaoComDocencia: string;
  enquadramentoMei: string;
  horasSemanaisMin: number | null;
  horasSemanaisMax: number | null;
  formasDeComecar: unknown;
};

export async function gerarFichaProfessorOpenAI(
  negocio: NegocioParaFicha,
  observacao?: string,
): Promise<FichaProfessor> {
  // Fontes e evidência ficam de fora de propósito: a ficha não cita links.
  const registro = {
    codigo: negocio.codigo,
    nome: negocio.nome,
    posicionamento: negocio.posicionamento,
    oQueOClienteRecebe: negocio.oQueOClienteRecebe,
    compradorPersona: negocio.compradorPersona,
    gatilhoDeCompra: negocio.gatilhoDeCompra,
    clientePagaParaResolver: negocio.clientePagaParaResolver,
    modeloDeReceita: negocio.modeloDeReceita,
    faixaDePreco: negocio.faixaDePreco,
    comoCresce: negocio.comoCresce,
    riscoEstrutural: negocio.riscoEstrutural,
    exigenciasLegais: negocio.exigenciasLegais,
    onde: negocio.tagOnde,
    preparo: negocio.tagPreparo,
    investimentoInicial: negocio.tagInvestimentoInicial,
    habilidadesDoProfessor: negocio.habilidadesDoProfessor,
    relacaoComDocencia: negocio.relacaoComDocencia,
    horasSemanais: { min: negocio.horasSemanaisMin, max: negocio.horasSemanaisMax },
    formasDeComecar: negocio.formasDeComecar,
  };

  const userMessage = `REGISTRO DO NEGÓCIO\n${JSON.stringify(registro, null, 1)}${
    observacao?.trim() ? `\n\nOBSERVAÇÃO DO REVISOR (siga ao reescrever a ficha):\n${observacao.trim()}` : ""
  }`;

  const completion = await openai.chat.completions.create({
    model: FICHA_MODEL,
    max_completion_tokens: 6000,
    messages: [
      { role: "system", content: GERAR_FICHA_PROFESSOR_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "ficha_professor", strict: true, schema: JSON_SCHEMA },
    },
  });
  await logAiUsage("gerar-ficha-professor", FICHA_MODEL, completion.usage);

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Resposta da OpenAI (ficha do professor) não contém texto.");

  return comLinhaMei(fichaSchema.parse(JSON.parse(content)), negocio.enquadramentoMei);
}
