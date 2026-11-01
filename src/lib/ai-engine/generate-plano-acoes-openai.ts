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

// O prompt pede de 5 a 10 ações e de 3 a 9 passos por checklist, mas a IA às vezes passa um
// pouco do limite. Recusar o plano inteiro por isso jogaria fora uma geração de dois minutos,
// então a validação é mais folgada que o pedido: só barra o que quebraria a tela (ação sem
// passos, plano minúsculo ou gigante). O prompt continua sendo a regra; aqui é a rede de segurança.

export const planoDeAcoesSchema = z.object({
  encaixe: z.object({ classificacao: z.enum(CLASSIFICACOES_ENCAIXE), explicacao: texto }),
  resumo: z.object({ por_que_esse_plano: texto, resultado_minimo_viavel: texto, entrega_final: texto }),
  acoes: z
    .array(
      z.object({
        nome: texto,
        objetivo: texto,
        definicao_de_pronto: texto,
        checklist: z.array(texto).min(3).max(12),
        como_fazer: z.array(texto).min(2).max(8),
        pontos_de_atencao: z.array(texto).min(1).max(6),
        erros_comuns: z.array(texto).min(1).max(6),
      }),
    )
    .min(5)
    .max(12),
  // Os 5 marcos (medalhas): cada um aponta a ação (1 a N) que o fecha. Não é validado aqui:
  // se vier errado, marcos.ts distribui os marcos por conta própria em vez de falhar o plano.
  marcos: z.array(z.object({ acao: z.number().int(), nome: texto })).default([]),
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
    marcos: {
      type: "array",
      items: {
        type: "object",
        properties: { acao: { type: "integer" }, nome: str },
        required: ["acao", "nome"],
        additionalProperties: false,
      },
    },
  },
  required: ["encaixe", "resumo", "acoes", "marcos"],
  additionalProperties: false,
} as const;

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
    `CONDIÇÃO DA PESSOA
Orçamento: ${ORCAMENTO_TEXTO[params.orcamentoFaixa] ?? params.orcamentoFaixa}`,
  ].filter((p): p is string => Boolean(p));

  // Uma segunda tentativa só quando a resposta veio mas não passou na validação (raro, e a
  // IA costuma acertar na outra). Erro de rede ou da própria API sobe direto.
  let ultimoErro: unknown;
  for (let tentativa = 1; tentativa <= 2; tentativa++) {
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
    if (!content) {
      ultimoErro = new Error("Resposta da OpenAI (plano de ações) não contém texto.");
      continue;
    }
    try {
      return planoDeAcoesSchema.parse(JSON.parse(content));
    } catch (err) {
      ultimoErro = err;
    }
  }
  throw ultimoErro;
}
