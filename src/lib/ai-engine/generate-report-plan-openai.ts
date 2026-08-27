// Versão OpenAI de generate-report-plan.ts — a chamada mais pesada de todas
// (duração variável de 4 a 12 semanas, tarefas com hora estimada), a que
// mais sofria com o teto de 60s da Vercel Hobby via Anthropic. Mesmo
// prompt, saída estruturada (json_schema strict) em vez de extração de
// texto.
import { z } from "zod";
import type {
  AcaoAceita,
  DistribuicaoTempo,
  EquilibrioAprenderExecutar,
  EstagioInicial,
  OrcamentoFaixa,
  RegraSegurancaFinanceira,
  RitmoDesejado,
} from "@/generated/prisma/client";
import { openai, OPENAI_GENERATION_MODEL } from "./openai-client";
import { REPORT_PLAN_SYSTEM_PROMPT } from "./report-plan-prompt";
import {
  calcularDuracaoSemanas,
  DURACAO_MAX_SEMANAS,
  DURACAO_MIN_SEMANAS,
  esforcoParaNivel,
  marcosMaxParaDuracao,
} from "@/lib/plano/formula";
import type { MapaExecucao } from "./generate-possibilities-openai";

const taskSchema = z.object({
  texto: z.string().min(1),
  horas: z.number().positive(),
  opcional: z.boolean().default(false),
});

const weekSchema = z.object({
  meta: z.string().min(1),
  tarefas: z.array(taskSchema).min(1),
  dificuldades_antecipadas: z.string().min(1),
});

const MARCO_TIPO_VALUES = ["entrega_controlavel", "sinal_externo"] as const;

const marcoSchema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().min(1),
  tipo: z.enum(MARCO_TIPO_VALUES).default("entrega_controlavel"),
});

const CLASSIFICACAO_ENCAIXE_VALUES = [
  "cabe_agora",
  "cabe_com_adaptacao",
  "construcao_medio_prazo",
  "conflito_explicito",
] as const;

const NIVEL_EXECUCAO_VALUES = ["validacao", "implementacao", "desenvolvimento"] as const;

const responseSchema = z.object({
  relatorio: z.object({
    quem_aparece: z.string().min(1),
    padroes_que_se_repetem: z.string().min(1),
    por_que_esse_caminho: z.string().min(1),
    ja_possui_vs_aprender: z.string().min(1),
    ponto_de_atencao: z.string().min(1),
    classificacao_encaixe: z.enum(CLASSIFICACAO_ENCAIXE_VALUES),
    explicacao_encaixe: z.string().min(1),
    nivel_execucao: z.enum(NIVEL_EXECUCAO_VALUES),
    resultado_minimo_viavel: z.string().min(1),
    ttfr_semanas: z.number().int().positive(),
    ttfr_resultado: z.string().min(1),
    proporcao_aprendizado: z.number().min(0).max(1),
  }),
  semanas: z.array(weekSchema).min(1),
  // Best effort — ver normalizeMarcos: uma contagem fora do alvo (proporcional
  // à duração final) não derruba a geração inteira, só ajusta o que sobra pra tela.
  marcos: z.array(marcoSchema).max(8).default([]),
});

export type ReportAndPlan = z.infer<typeof responseSchema>;

const JSON_SCHEMA = {
  type: "object",
  properties: {
    relatorio: {
      type: "object",
      properties: {
        quem_aparece: { type: "string" },
        padroes_que_se_repetem: { type: "string" },
        por_que_esse_caminho: { type: "string" },
        ja_possui_vs_aprender: { type: "string" },
        ponto_de_atencao: { type: "string" },
        classificacao_encaixe: { type: "string", enum: CLASSIFICACAO_ENCAIXE_VALUES },
        explicacao_encaixe: { type: "string" },
        nivel_execucao: { type: "string", enum: NIVEL_EXECUCAO_VALUES },
        resultado_minimo_viavel: { type: "string" },
        ttfr_semanas: { type: "number" },
        ttfr_resultado: { type: "string" },
        proporcao_aprendizado: { type: "number" },
      },
      required: [
        "quem_aparece",
        "padroes_que_se_repetem",
        "por_que_esse_caminho",
        "ja_possui_vs_aprender",
        "ponto_de_atencao",
        "classificacao_encaixe",
        "explicacao_encaixe",
        "nivel_execucao",
        "resultado_minimo_viavel",
        "ttfr_semanas",
        "ttfr_resultado",
        "proporcao_aprendizado",
      ],
      additionalProperties: false,
    },
    semanas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          meta: { type: "string" },
          tarefas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                texto: { type: "string" },
                horas: { type: "number" },
                opcional: { type: "boolean" },
              },
              required: ["texto", "horas", "opcional"],
              additionalProperties: false,
            },
          },
          dificuldades_antecipadas: { type: "string" },
        },
        required: ["meta", "tarefas", "dificuldades_antecipadas"],
        additionalProperties: false,
      },
    },
    marcos: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          descricao: { type: "string" },
          tipo: { type: "string", enum: MARCO_TIPO_VALUES },
        },
        required: ["titulo", "descricao", "tipo"],
        additionalProperties: false,
      },
    },
  },
  required: ["relatorio", "semanas", "marcos"],
  additionalProperties: false,
} as const;

const ESTAGIO_LABELS: Record<EstagioInicial, string> = {
  NUNCA_FIZ: "Nunca fez nada relacionado, precisa começar do início.",
  PESQUISEI_NAO_EXECUTEI: "Já pesquisou ou estudou um pouco, mas ainda não executou.",
  FIZ_ISOLADO: "Já fez algo parecido de forma isolada ou informal.",
  TENHO_CASO_PORTFOLIO: "Já tem um caso, amostra, portfólio ou resultado que pode organizar.",
  ATUO_PARCIALMENTE: "Já atua parcialmente nisso e quer transformar em atividade profissional mais estruturada.",
};

const DISTRIBUICAO_LABELS: Record<DistribuicaoTempo, string> = {
  BLOCO_UNICO: "Um bloco maior em um único dia.",
  BLOCOS_MEDIOS: "Dois ou três blocos médios durante a semana.",
  SESSOES_CURTAS: "Sessões curtas distribuídas em vários dias.",
  AGENDA_VARIAVEL: "Agenda variável — precisa de tarefas que possam ser reorganizadas.",
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

const EQUILIBRIO_LABELS: Record<EquilibrioAprenderExecutar, string> = {
  FOCO_EXECUCAO: "Aprender só o necessário e testar rápido — cerca de 20% aprendizado, 80% execução.",
  EQUILIBRADO: "Equilibrar preparação e prática — cerca de 40% aprendizado, 60% execução.",
  FOCO_APRENDIZADO: "Construir uma base maior antes de se expor — até 60% aprendizado, 40% execução.",
  SISTEMA_RECOMENDA: "Sem preferência — decida o equilíbrio a partir do estágio inicial da pessoa.",
};

const RITMO_LABELS: Record<RitmoDesejado, string> = {
  RAPIDO: "Quer um plano mais rápido e concentrado.",
  EQUILIBRADO: "Prefere um plano equilibrado.",
  GRADUAL: "Prefere um plano mais leve e gradual.",
  SISTEMA_RECOMENDA: "Sem preferência — decida o ritmo mais adequado a partir do resto do perfil da pessoa.",
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

function formatMapaExecucao(mapa: MapaExecucao): string {
  return `Objetivo principal: ${mapa.objetivoPrincipal}
Resultado Mínimo Viável (RMV) desta possibilidade: ${mapa.resultadoMinimoViavel}
Esforço estimado — Validação: ${mapa.esforcoMinimoHoras}h | Implementação: ${mapa.esforcoRecomendadoHoras}h | Desenvolvimento: ${mapa.esforcoAvancadoHoras}h
TTFR-base (semanas até o primeiro resultado, antes de ajustar pelo perfil da pessoa): ${mapa.ttfrBaseSemanas}
Competências necessárias: ${mapa.competenciasNecessarias.join("; ") || "nenhuma listada"}
Competências a desenvolver: ${mapa.competenciasADesenvolver.join("; ") || "nenhuma listada"}
Ações essenciais: ${mapa.acoesEssenciais.join("; ") || "nenhuma listada"}
Nível de complexidade: ${mapa.nivelComplexidade}
Principais dependências: ${mapa.principaisDependencias.join("; ") || "nenhuma"}
Primeiro resultado observável esperado: ${mapa.primeiroResultadoObservavel}`;
}

export async function generateReportAndPlanOpenAI(params: {
  diagnosticInput: string;
  possibility: {
    titulo: string;
    naPratica: string;
    porQueApareceu: string;
    quemPagaria: string;
    jaPossuiVsAprender: string;
  };
  mapaExecucao: MapaExecucao;
  horasPorSemana: number;
  horasNucleoSemana: number;
  estagioInicial: EstagioInicial;
  distribuicaoTempo: DistribuicaoTempo;
  orcamentoFaixa: OrcamentoFaixa;
  regraSegurancaFinanceira: RegraSegurancaFinanceira;
  acoesAceitas: AcaoAceita[];
  equilibrioAprenderExecutar: EquilibrioAprenderExecutar;
  ritmoDesejado: RitmoDesejado;
  condicaoAdicionalExecucao?: string | null;
}): Promise<ReportAndPlan> {
  const userMessage = `${params.diagnosticInput}

POSSIBILIDADE APROVADA
Título: ${params.possibility.titulo}
Na prática: ${params.possibility.naPratica}
Por que apareceu: ${params.possibility.porQueApareceu}
Quem pagaria: ${params.possibility.quemPagaria}
Já possui vs. a aprender: ${params.possibility.jaPossuiVsAprender}

MAPA DE EXECUÇÃO DA POSSIBILIDADE
${formatMapaExecucao(params.mapaExecucao)}

PARÂMETROS DO PLANO (já calculados, não decida isso)
Janela de duração permitida: entre ${DURACAO_MIN_SEMANAS} e ${DURACAO_MAX_SEMANAS} semanas — você decide o nível de execução, a duração nasce dele (ver instruções do sistema)
Tempo disponível por semana declarado pela pessoa: ${params.horasPorSemana} horas
Núcleo semanal (teto de tarefas obrigatórias por semana, individualmente): ${params.horasNucleoSemana} horas

RESPOSTAS DE ADEQUAÇÃO DA EXECUÇÃO
Estágio inicial: ${ESTAGIO_LABELS[params.estagioInicial]}
Distribuição do tempo na semana: ${DISTRIBUICAO_LABELS[params.distribuicaoTempo]}
Orçamento disponível: ${ORCAMENTO_LABELS[params.orcamentoFaixa]}
Regra de segurança financeira: ${REGRA_FINANCEIRA_LABELS[params.regraSegurancaFinanceira]}
Ações que a pessoa aceita realizar: ${params.acoesAceitas.map((a) => ACAO_LABELS[a]).join("; ")}
Equilíbrio entre aprender e executar: ${EQUILIBRIO_LABELS[params.equilibrioAprenderExecutar]}
Ritmo desejado: ${RITMO_LABELS[params.ritmoDesejado]}
Condição adicional declarada: ${params.condicaoAdicionalExecucao?.trim() || "nenhuma"}`;

  // Uma única tentativa, de propósito: cada chamada já leva 30-45s, e a
  // Vercel mata a função aos 60s (teto do plano Hobby) — não sobra tempo
  // pra uma segunda rodada dentro da mesma requisição. A duração final é
  // corrigida deterministicamente depois (normalizeWeekCount), então o
  // lembrete abaixo pede só consistência interna, não uma contagem exata
  // fixa (que não existe mais).
  const completion = await openai.chat.completions.create({
    model: OPENAI_GENERATION_MODEL,
    max_completion_tokens: 16000,
    messages: [
      { role: "system", content: REPORT_PLAN_SYSTEM_PROMPT },
      {
        role: "user",
        content: `${userMessage}\n\nLEMBRETE FINAL: confira que o número de semanas do array "semanas" é coerente com o nível de execução que você escolheu (esforço daquele nível ÷ núcleo semanal, entre ${DURACAO_MIN_SEMANAS} e ${DURACAO_MAX_SEMANAS}), que a última semana fecha o ciclo, que existe uma revisão intermediária perto do meio do plano, e que nenhuma semana individualmente estourou o núcleo semanal informado acima.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "relatorio_e_plano", strict: true, schema: JSON_SCHEMA },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Resposta da OpenAI não contém texto.");
  }

  const parsed = responseSchema.parse(JSON.parse(content));

  const esforcoEscolhido = esforcoParaNivel(parsed.relatorio.nivel_execucao, params.mapaExecucao);
  const duracaoAlvoSemanas = calcularDuracaoSemanas(esforcoEscolhido, params.horasNucleoSemana);

  const semanasNormalizadas = normalizeWeekCount(parsed, duracaoAlvoSemanas);
  const horasNormalizadas = normalizeWeekHours(semanasNormalizadas, params.horasNucleoSemana);
  return normalizeMarcoTipos(normalizeMarcos(horasNormalizadas, marcosMaxParaDuracao(duracaoAlvoSemanas)));
}

// Marcos são um extra sobre o plano principal — nunca vale a pena falhar
// uma chamada de ~40s por causa da contagem deles. Só limita o teto
// (proporcional à duração final do plano); vir com menos que o alvo (ou até
// 0) é aceito como está, a tela reage ao que tiver.
function normalizeMarcos(parsed: ReportAndPlan, maxMarcos: number): ReportAndPlan {
  if (parsed.marcos.length <= maxMarcos) return parsed;
  return { ...parsed, marcos: parsed.marcos.slice(0, maxMarcos) };
}

// Em teste, o modelo às vezes devolve uma semana a mais que o alvo calculado
// deterministicamente a partir do nível de execução que ele mesmo escolheu —
// a estrutura em si sempre vem válida, só a contagem varia. Em vez de falhar
// (e gastar os ~40s da chamada à toa), funde as semanas excedentes na
// última: o mural + pool de pendências já construídos absorvem bem uma
// semana final mais cheia — a pessoa pode empurrar itens pro pool se achar
// pesado demais. Faltar semana (menos que o alvo) é bem mais raro e mais
// arriscado de "inventar" conteúdo, então esse caso continua falhando.
function normalizeWeekCount(parsed: ReportAndPlan, duracaoAlvoSemanas: number): ReportAndPlan {
  if (parsed.semanas.length === duracaoAlvoSemanas) return parsed;

  if (parsed.semanas.length < duracaoAlvoSemanas) {
    throw new Error(
      `O modelo retornou ${parsed.semanas.length} semanas, esperado ${duracaoAlvoSemanas} (nível de execução: ${parsed.relatorio.nivel_execucao}).`,
    );
  }

  const kept = parsed.semanas.slice(0, duracaoAlvoSemanas - 1);
  const extra = parsed.semanas.slice(duracaoAlvoSemanas - 1);
  const lastWeek = extra[0];
  const mergedTasks = extra.flatMap((w) => w.tarefas);
  const mergedDificuldades = extra
    .map((w) => w.dificuldades_antecipadas)
    .filter(Boolean)
    .join(" ");

  return {
    ...parsed,
    semanas: [
      ...kept,
      { meta: lastWeek.meta, tarefas: mergedTasks, dificuldades_antecipadas: mergedDificuldades },
    ],
  };
}

// Rede de segurança determinística — o prompt já instrui a IA a nunca
// ultrapassar o núcleo semanal, mas a saída estruturada garante formato e
// tipos, não aritmética. Em vez de confiar cegamente no texto do prompt
// (foi exatamente assim que o defeito da semana 12 escapou antes), o
// código soma de novo as horas de cada semana e, se uma semana estourar o
// núcleo, reclassifica as últimas tarefas obrigatórias como opcionais até
// caber — nunca inventa conteúdo novo, só marca o excedente como
// opcional, que é exatamente o que "opcional" já significa no resto do
// sistema. Sempre mantém pelo menos 1 tarefa obrigatória por semana.
const TOLERANCIA_HORAS = 0.05; // folga pra arredondamento de ponto flutuante
function normalizeWeekHours(parsed: ReportAndPlan, horasNucleoSemana: number): ReportAndPlan {
  const semanas = parsed.semanas.map((semana) => {
    const tarefas = [...semana.tarefas];
    let somaObrigatoria = tarefas.filter((t) => !t.opcional).reduce((sum, t) => sum + t.horas, 0);
    if (somaObrigatoria <= horasNucleoSemana + TOLERANCIA_HORAS) return semana;

    let obrigatoriasRestantes = tarefas.filter((t) => !t.opcional).length;
    for (let i = tarefas.length - 1; i >= 0 && somaObrigatoria > horasNucleoSemana + TOLERANCIA_HORAS; i--) {
      if (tarefas[i].opcional || obrigatoriasRestantes <= 1) continue;
      somaObrigatoria -= tarefas[i].horas;
      tarefas[i] = { ...tarefas[i], opcional: true };
      obrigatoriasRestantes--;
    }
    return { ...semana, tarefas };
  });

  return { ...parsed, semanas };
}

// Mesma lógica de "nunca falhar a chamada por uma regra qualitativa que a
// IA não seguiu à risca" das outras normalizações acima — se vier mais de
// 1 marco "sinal_externo" (a regra do prompt pede no máximo 1), rebaixa os
// excedentes pra "entrega_controlavel", mantendo só o primeiro como está.
function normalizeMarcoTipos(parsed: ReportAndPlan): ReportAndPlan {
  let externosVistos = 0;
  const marcos = parsed.marcos.map((marco) => {
    if (marco.tipo !== "sinal_externo") return marco;
    externosVistos++;
    return externosVistos > 1 ? { ...marco, tipo: "entrega_controlavel" as const } : marco;
  });
  return { ...parsed, marcos };
}
