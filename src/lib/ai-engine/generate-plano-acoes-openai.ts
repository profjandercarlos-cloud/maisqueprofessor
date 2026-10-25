// Gera o plano de execução por ações (sem semanas). Ver plano-acoes-prompt.ts.
import { z } from "zod";
import { openai, OPENAI_GENERATION_MODEL } from "./openai-client";
import { PLANO_ACOES_SYSTEM_PROMPT } from "./plano-acoes-prompt";
import { logAiUsage } from "./log-ai-usage";
import type { MapaExecucao } from "./generate-mapa-execucao-openai";

export const CLASSIFICACOES_ENCAIXE = [
  "cabe_agora",
  "cabe_com_adaptacao",
  "construcao_medio_prazo",
  "conflito_explicito",
] as const;

const texto = z.string().min(1);

export const planoDeAcoesSchema = z.object({
  encaixe: z.object({ classificacao: z.enum(CLASSIFICACOES_ENCAIXE), explicacao: texto }),
  resumo: z.object({ por_que_esse_plano: texto, resultado_minimo_viavel: texto, entrega_final: texto }),
  acoes: z
    .array(
      z.object({
        nome: texto,
        objetivo: texto,
        definicao_de_pronto: texto,
        checklist: z.array(texto).min(3).max(9),
        como_fazer: z.array(texto).min(2).max(6),
        pontos_de_atencao: z.array(texto).min(1).max(4),
        erros_comuns: z.array(texto).min(1).max(4),
      }),
    )
    .min(5)
    .max(10),
});

export type PlanoDeAcoes = z.infer<typeof planoDeAcoesSchema>;

const str = { type: "string" } as const;
const strList = { type: "array", items: str } as const;

const JSON_SCHEMA = {
  type: "object",
  properties: {
    encaixe: {
      type: "object",
      properties: { classificacao: { type: "string", enum: CLASSIFICACOES_ENCAIXE }, explicacao: str },
      required: ["classificacao", "explicacao"],
      additionalProperties: false,
    },
    resumo: {
      type: "object",
      properties: { por_que_esse_plano: str, resultado_minimo_viavel: str, entrega_final: str },
      required: ["por_que_esse_plano", "resultado_minimo_viavel", "entrega_final"],
      additionalProperties: false,
    },
    acoes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nome: str,
          objetivo: str,
          definicao_de_pronto: str,
          checklist: strList,
          como_fazer: strList,
          pontos_de_atencao: strList,
          erros_comuns: strList,
        },
        required: ["nome", "objetivo", "definicao_de_pronto", "checklist", "como_fazer", "pontos_de_atencao", "erros_comuns"],
        additionalProperties: false,
      },
    },
  },
  required: ["encaixe", "resumo", "acoes"],
  additionalProperties: false,
} as const;

const ESTAGIO_TEXTO: Record<string, string> = {
  NUNCA_FIZ: "Nunca fez nada relacionado e precisa começar do início.",
  PESQUISEI_NAO_EXECUTEI: "Já pesquisou ou estudou um pouco, mas ainda não executou.",
  FIZ_ISOLADO: "Já fez algo parecido de forma isolada ou informal.",
  TENHO_CASO_PORTFOLIO: "Já tem um caso, amostra, portfólio ou resultado que pode organizar.",
  ATUO_PARCIALMENTE: "Já atua parcialmente nisso e quer estruturar como atividade profissional.",
};

const ORCAMENTO_TEXTO: Record<string, string> = {
  SEM_INVESTIMENTO: "Não quer investir nada por enquanto.",
  ATE_300: "Até R$ 300 no total.",
  DE_300_A_1000: "Entre R$ 300 e R$ 1.000 no total.",
  ACIMA_DE_1000: "Acima de R$ 1.000 no total (cada gasto ainda precisa de justificativa).",
};

export type NegocioParaPlano = {
  titulo: string;
  comoFunciona: string;
  porQueCombinaComVoce: string;
  primeiroServico: string;
  pontoDeAtencao: string;
};

export async function generatePlanoDeAcoesOpenAI(params: {
  negocio: NegocioParaPlano;
  mapaExecucao: MapaExecucao;
  estagioInicial: string;
  horasPorSemana: number;
  orcamentoFaixa: string;
  /** Presente só quando o negócio nasceu do diagnóstico; ideias favoritas não têm. */
  diagnosticInput?: string | null;
}): Promise<PlanoDeAcoes> {
  const { negocio, mapaExecucao: m } = params;

  const partes = [
    params.diagnosticInput ? params.diagnosticInput : null,
    `NEGÓCIO ESCOLHIDO
Nome: ${negocio.titulo}
O que a empresa faz: ${negocio.comoFunciona}
Por que combina com a pessoa: ${negocio.porQueCombinaComVoce}
Primeiro serviço (a melhor forma de começar): ${negocio.primeiroServico}
Ponto de atenção: ${negocio.pontoDeAtencao}`,
    `MAPA DE EXECUÇÃO
Objetivo principal: ${m.objetivoPrincipal}
Resultado mínimo viável: ${m.resultadoMinimoViavel}
Primeiro resultado observável: ${m.primeiroResultadoObservavel}
Competências necessárias: ${m.competenciasNecessarias.join("; ")}
Competências a desenvolver: ${m.competenciasADesenvolver.join("; ")}
Ações essenciais: ${m.acoesEssenciais.join("; ")}
Principais dependências: ${m.principaisDependencias.join("; ")}
Complexidade: ${m.nivelComplexidade}`,
    `CONDIÇÕES DA PESSOA
Ponto de partida: ${ESTAGIO_TEXTO[params.estagioInicial] ?? params.estagioInicial}
Horas por semana que consegue reservar: ${params.horasPorSemana}
Orçamento: ${ORCAMENTO_TEXTO[params.orcamentoFaixa] ?? params.orcamentoFaixa}`,
  ].filter((p): p is string => Boolean(p));

  const completion = await openai.chat.completions.create({
    model: OPENAI_GENERATION_MODEL,
    max_completion_tokens: 14000,
    messages: [
      { role: "system", content: PLANO_ACOES_SYSTEM_PROMPT },
      { role: "user", content: partes.join("\n\n") },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "plano_de_acoes", strict: true, schema: JSON_SCHEMA },
    },
  });
  await logAiUsage("generate-plano-acoes", OPENAI_GENERATION_MODEL, completion.usage);

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Resposta da OpenAI (plano de ações) não contém texto.");

  return planoDeAcoesSchema.parse(JSON.parse(content));
}
