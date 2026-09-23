// Gera as 3 Missões de Ativação (Bloco 0) — depois do Mapa de Execução e da
// Adequação, antes do Plano de Execução Personalizado. Mesmo padrão de
// saída estruturada (json_schema strict) das outras chamadas do motor.
import { z } from "zod";
import type {
  AcaoAceita,
  EstagioInicial,
  OrcamentoFaixa,
  RegraSegurancaFinanceira,
  DistribuicaoTempo,
} from "@/generated/prisma/client";
import { openai, OPENAI_GENERATION_MODEL } from "./openai-client";
import { ACTIVATION_MISSIONS_SYSTEM_PROMPT } from "./activation-missions-prompt";
import type { MapaExecucao } from "./generate-mapa-execucao-openai";
import { logAiUsage } from "./log-ai-usage";

const MISSAO_TIPO_VALUES = ["capacidade", "realidade", "validacao"] as const;

const missaoSchema = z.object({
  tipo: z.enum(MISSAO_TIPO_VALUES),
  nome: z.string().min(1),
  objetivo: z.string().min(1),
  por_que_existe: z.string().min(1),
  tempo_estimado_minutos: z.number().int().positive(),
  recursos_necessarios: z.string().min(1),
  passo_a_passo: z.array(z.string().min(1)).min(3).max(6),
  criterio_conclusao: z.string().min(1),
  evidencia_esperada: z.string().min(1),
  pergunta_reflexao: z.string().min(1),
  pergunta_registro: z.string().min(1),
  exemplo_cenario: z.string().min(1),
  exemplo_resultado: z.string().min(1),
});

const responseSchema = z.object({
  missoes: z.array(missaoSchema).length(3),
});

export type ActivationMissionsResult = z.infer<typeof responseSchema>;

const MISSAO_JSON_SCHEMA = {
  type: "object",
  properties: {
    tipo: { type: "string", enum: MISSAO_TIPO_VALUES },
    nome: { type: "string" },
    objetivo: { type: "string" },
    por_que_existe: { type: "string" },
    tempo_estimado_minutos: { type: "number" },
    recursos_necessarios: { type: "string" },
    passo_a_passo: { type: "array", items: { type: "string" } },
    criterio_conclusao: { type: "string" },
    evidencia_esperada: { type: "string" },
    pergunta_reflexao: { type: "string" },
    pergunta_registro: { type: "string" },
    exemplo_cenario: { type: "string" },
    exemplo_resultado: { type: "string" },
  },
  required: [
    "tipo",
    "nome",
    "objetivo",
    "por_que_existe",
    "tempo_estimado_minutos",
    "recursos_necessarios",
    "passo_a_passo",
    "criterio_conclusao",
    "evidencia_esperada",
    "pergunta_reflexao",
    "pergunta_registro",
    "exemplo_cenario",
    "exemplo_resultado",
  ],
  additionalProperties: false,
} as const;

const JSON_SCHEMA = {
  type: "object",
  properties: {
    missoes: { type: "array", items: MISSAO_JSON_SCHEMA },
  },
  required: ["missoes"],
  additionalProperties: false,
} as const;

const ESTAGIO_LABELS: Record<EstagioInicial, string> = {
  NUNCA_FIZ: "Nunca fez nada relacionado, precisa começar do início.",
  PESQUISEI_NAO_EXECUTEI: "Já pesquisou ou estudou um pouco, mas ainda não executou.",
  FIZ_ISOLADO: "Já fez algo parecido de forma isolada ou informal.",
  TENHO_CASO_PORTFOLIO: "Já tem um caso, amostra, portfólio ou resultado que pode organizar.",
  ATUO_PARCIALMENTE: "Já atua parcialmente nisso e quer transformar em atividade profissional mais estruturada.",
};

const ORCAMENTO_LABELS: Record<OrcamentoFaixa, string> = {
  SEM_INVESTIMENTO: "Prefere não investir nada por enquanto.",
  ATE_300: "Até R$300 no total, ao longo do plano.",
  DE_300_A_1000: "Entre R$300 e R$1.000 no total, ao longo do plano.",
  ACIMA_DE_1000: "Acima de R$1.000 no total, ao longo do plano.",
};

const REGRA_FINANCEIRA_LABELS: Record<RegraSegurancaFinanceira, string> = {
  MANTER_RENDA_INTEGRAL: "Precisa manter integralmente a renda e os compromissos atuais.",
  SEM_COMPROMISSO_ANTES_EVIDENCIA:
    "Pode avançar, mas não quer assumir compromissos financeiros ou profissionais antes de ver evidências.",
  TRANSICAO_GRADUAL: "Aceita uma transição gradual, desde que cada passo tenha critério claro.",
  MARGEM_PARA_DEDICAR: "Tem margem para dedicar mais energia à mudança durante este período.",
  NAO_SE_APLICA: "Regra financeira não se aplica à situação da pessoa.",
};

const ACAO_LABELS: Record<AcaoAceita, string> = {
  PESQUISAR: "Pesquisar vagas, compradores, organizações ou concorrentes",
  CONVERSAR: "Conversar com profissionais, potenciais usuários ou possíveis clientes",
  PRODUZIR_AMOSTRA: "Produzir uma amostra, estudo de caso ou portfólio",
  PUBLICAR_CONTEUDO: "Publicar conteúdo ou uma amostra profissional",
  ENVIAR_CANDIDATURAS: "Enviar currículos ou candidaturas",
  PROPOSTA_COMERCIAL: "Apresentar proposta comercial com preço e escopo definidos",
  PILOTO_REMUNERADO: "Realizar um piloto remunerado e de escopo limitado",
  ATIVIDADE_PRESENCIAL: "Participar de atividade presencial ou visitar um local",
  PREPARAR_PRIVADAMENTE: "Preparar-se de forma privada, sem contato externo por enquanto",
};

const DISTRIBUICAO_LABELS: Record<DistribuicaoTempo, string> = {
  BLOCO_UNICO: "Um bloco maior em um único dia.",
  BLOCOS_MEDIOS: "Dois ou três blocos médios durante a semana.",
  SESSOES_CURTAS: "Sessões curtas distribuídas em vários dias.",
  AGENDA_VARIAVEL: "Agenda variável — precisa de tarefas que possam ser reorganizadas.",
};

function formatMapaExecucao(mapa: MapaExecucao): string {
  return `Objetivo principal: ${mapa.objetivoPrincipal}
Resultado Mínimo Viável (RMV): ${mapa.resultadoMinimoViavel}
Ações essenciais: ${mapa.acoesEssenciais.join("; ") || "nenhuma listada"}
Competências necessárias: ${mapa.competenciasNecessarias.join("; ") || "nenhuma listada"}
Competências a desenvolver: ${mapa.competenciasADesenvolver.join("; ") || "nenhuma listada"}
Primeiro resultado observável esperado: ${mapa.primeiroResultadoObservavel}`;
}

export async function generateActivationMissionsOpenAI(params: {
  diagnosticInput: string;
  possibility: {
    titulo: string;
    comoFunciona: string;
    comoGerarReceita: string;
    porQueCombinaComVoce: string;
    primeiraValidacao: string;
    pontoDeAtencao: string;
  };
  mapaExecucao: MapaExecucao;
  estagioInicial: EstagioInicial;
  acoesAceitas: AcaoAceita[];
  orcamentoFaixa: OrcamentoFaixa;
  regraSegurancaFinanceira: RegraSegurancaFinanceira;
  distribuicaoTempo: DistribuicaoTempo;
}): Promise<ActivationMissionsResult> {
  const userMessage = `${params.diagnosticInput}

POSSIBILIDADE APROVADA
Título: ${params.possibility.titulo}
A possibilidade: ${params.possibility.comoFunciona}
Como pode gerar receita: ${params.possibility.comoGerarReceita}
Por que combina com a pessoa: ${params.possibility.porQueCombinaComVoce}
Como validar: ${params.possibility.primeiraValidacao}
Principal ponto de atenção: ${params.possibility.pontoDeAtencao}

MAPA DE EXECUÇÃO DA POSSIBILIDADE
${formatMapaExecucao(params.mapaExecucao)}

RESPOSTAS DE ADEQUAÇÃO RELEVANTES
Estágio inicial: ${ESTAGIO_LABELS[params.estagioInicial]}
Ações que a pessoa aceita realizar: ${params.acoesAceitas.map((a) => ACAO_LABELS[a]).join("; ")}
Orçamento disponível: ${ORCAMENTO_LABELS[params.orcamentoFaixa]}
Regra de segurança financeira: ${REGRA_FINANCEIRA_LABELS[params.regraSegurancaFinanceira]}
Distribuição do tempo na semana: ${DISTRIBUICAO_LABELS[params.distribuicaoTempo]}`;

  const completion = await openai.chat.completions.create({
    model: OPENAI_GENERATION_MODEL,
    max_completion_tokens: 10000,
    messages: [
      { role: "system", content: ACTIVATION_MISSIONS_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "missoes_ativacao", strict: true, schema: JSON_SCHEMA },
    },
  });
  await logAiUsage("generate-activation-missions", OPENAI_GENERATION_MODEL, completion.usage);

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Resposta da OpenAI não contém texto.");
  }

  return responseSchema.parse(JSON.parse(content));
}
