// Conteúdo transcrito de Questionario_Adequacao_Execucao_MaisQueProfessor.docx
// — não alterar a redação das perguntas/opções sem revisar o documento
// fonte. Os `value` das opções de escolha única batem propositalmente com
// os valores dos enums Prisma correspondentes (EstagioInicial,
// DistribuicaoTempo, OrcamentoFaixa, RegraSegurancaFinanceira,
// EquilibrioAprenderExecutar, NivelAcompanhamento, AcaoAceita), pra não
// precisar de remapeamento na hora de criar o Plan.
import type { WizardStep } from "@/lib/wizard/step-types";
import { WEEKDAY_LABELS } from "@/lib/plano/weekdays";

export const ADEQUACAO_STEPS: WizardStep[] = [
  {
    slug: "estagio-inicial",
    block: 1,
    type: "single-select",
    question: "Em que ponto você está em relação a esta possibilidade?",
    options: [
      { value: "NUNCA_FIZ", label: "Nunca fiz nada relacionado e preciso começar do início." },
      { value: "PESQUISEI_NAO_EXECUTEI", label: "Já pesquisei ou estudei um pouco, mas ainda não executei." },
      { value: "FIZ_ISOLADO", label: "Já fiz algo parecido de forma isolada ou informal." },
      { value: "TENHO_CASO_PORTFOLIO", label: "Já tenho um caso, amostra, portfólio ou resultado que posso organizar." },
      {
        value: "ATUO_PARCIALMENTE",
        label: "Já atuo parcialmente nisso e quero transformar em uma atividade profissional mais estruturada.",
      },
    ],
    path: ["estagioInicial"],
  },
  {
    slug: "horas-semanais",
    block: 1,
    type: "number",
    question: "Quantas horas por semana você realmente consegue reservar para este plano?",
    helper: "Considere uma média sustentável ao longo de todo o período de execução, não uma semana excepcional.",
    min: 1,
    max: 40,
    step: 0.5,
    defaultValue: 4,
    path: ["horasSemanaisDisponiveis"],
  },
  {
    slug: "distribuicao-tempo",
    block: 1,
    type: "single-select",
    question: "Como essas horas costumam caber melhor na sua semana?",
    options: [
      { value: "BLOCO_UNICO", label: "Um bloco maior em um único dia." },
      { value: "BLOCOS_MEDIOS", label: "Dois ou três blocos médios durante a semana." },
      { value: "SESSOES_CURTAS", label: "Sessões curtas distribuídas em vários dias." },
      { value: "AGENDA_VARIAVEL", label: "Minha agenda varia; preciso de tarefas que possam ser reorganizadas." },
    ],
    path: ["distribuicaoTempo"],
  },
  {
    slug: "orcamento",
    block: 1,
    type: "single-select",
    question: "Quanto você tem disponível para investir ao longo deste plano, se realmente for necessário?",
    helper: "O plano não precisa gastar esse valor. Ele apenas não poderá ultrapassar o limite escolhido.",
    options: [
      { value: "SEM_INVESTIMENTO", label: "Prefiro não investir nada por enquanto." },
      { value: "ATE_300", label: "Até R$300 no total." },
      { value: "DE_300_A_1000", label: "Entre R$300 e R$1.000 no total." },
      { value: "ACIMA_DE_1000", label: "Acima de R$1.000 no total." },
    ],
    path: ["orcamentoTotal12Semanas"],
  },
  {
    slug: "seguranca-financeira",
    block: 1,
    type: "single-select",
    question: "Durante o período de execução, qual regra financeira o plano precisa respeitar?",
    options: [
      { value: "MANTER_RENDA_INTEGRAL", label: "Preciso manter integralmente minha renda e meus compromissos atuais." },
      {
        value: "SEM_COMPROMISSO_ANTES_EVIDENCIA",
        label: "Posso avançar, mas não quero assumir compromissos financeiros ou profissionais antes de ver evidências.",
      },
      { value: "TRANSICAO_GRADUAL", label: "Aceito uma transição gradual, desde que cada passo tenha critério claro." },
      { value: "MARGEM_PARA_DEDICAR", label: "Tenho margem para dedicar mais energia à mudança durante este período." },
      { value: "NAO_SE_APLICA", label: "Esta pergunta não se aplica à minha situação." },
    ],
    path: ["regraSegurancaFinanceira"],
  },
  {
    slug: "acoes-aceitas",
    block: 1,
    type: "multi-select",
    question: "Que tipos de ação você aceita realizar durante o experimento?",
    helper: "Escolha todas as que cabem na sua realidade. O plano usará somente ações autorizadas.",
    options: [
      { value: "PESQUISAR", label: "Pesquisar vagas, compradores, organizações ou concorrentes." },
      {
        value: "CONVERSAR",
        label: "Conversar com profissionais, potenciais usuários ou possíveis clientes para entender necessidades.",
      },
      {
        value: "PRODUZIR_AMOSTRA",
        label: "Produzir uma amostra, estudo de caso ou portfólio com dados próprios, públicos, fictícios ou autorizados.",
      },
      { value: "PUBLICAR_CONTEUDO", label: "Publicar conteúdo ou uma amostra profissional." },
      { value: "ENVIAR_CANDIDATURAS", label: "Enviar currículos ou candidaturas." },
      { value: "PROPOSTA_COMERCIAL", label: "Apresentar proposta comercial com preço e escopo definidos." },
      { value: "PILOTO_REMUNERADO", label: "Realizar um piloto remunerado e de escopo limitado." },
      { value: "ATIVIDADE_PRESENCIAL", label: "Participar de atividade presencial ou visitar um local." },
      { value: "PREPARAR_PRIVADAMENTE", label: "Prefiro me preparar de forma privada antes de contatar outras pessoas." },
    ],
    minSelect: 1,
    path: ["acoesAceitas"],
  },
  {
    slug: "equilibrio-aprender-executar",
    block: 1,
    type: "single-select",
    question: "Como você prefere equilibrar aprendizado e prática neste plano?",
    options: [
      {
        value: "FOCO_EXECUCAO",
        label: "Aprender apenas o necessário e testar rapidamente — cerca de 20% aprendizado e 80% execução.",
      },
      { value: "EQUILIBRADO", label: "Equilibrar preparação e prática — cerca de 40% aprendizado e 60% execução." },
      {
        value: "FOCO_APRENDIZADO",
        label: "Construir uma base maior antes de me expor — até 60% aprendizado e 40% execução.",
      },
      { value: "SISTEMA_RECOMENDA", label: "Prefiro que o sistema recomende o equilíbrio a partir do meu ponto de partida." },
    ],
    path: ["equilibrioAprenderExecutar"],
  },
  {
    slug: "ritmo-desejado",
    block: 1,
    type: "single-select",
    question: "Como você prefere executar esta possibilidade?",
    options: [
      { value: "RAPIDO", label: "Quero um plano mais rápido e concentrado." },
      { value: "EQUILIBRADO", label: "Prefiro um plano equilibrado." },
      { value: "GRADUAL", label: "Prefiro um plano mais leve e gradual." },
      { value: "SISTEMA_RECOMENDA", label: "Quero que o sistema recomende o ritmo mais adequado para mim." },
    ],
    path: ["ritmoDesejado"],
  },
  {
    slug: "nivel-acompanhamento",
    block: 1,
    type: "single-select",
    question: "Que nível de acompanhamento você quer durante o período de execução?",
    options: [
      { value: "MINIMO", label: "Mínimo — um check-in no dia escolhido, nenhum lembrete adicional." },
      { value: "MEDIO", label: "Médio — check-in semanal e um lembrete quando o check-in estiver atrasado." },
      { value: "ALTO", label: "Alto — check-in semanal, mensagem no meio da semana e lembrete de atraso." },
    ],
    path: ["nivelAcompanhamento"],
  },
  {
    slug: "dia-checkin",
    block: 1,
    type: "single-select",
    question: "Em qual dia da semana você quer receber o check-in?",
    options: WEEKDAY_LABELS.map((label, index) => ({ value: String(index), label })),
    path: ["diaCheckin"],
  },
  {
    slug: "condicao-adicional",
    block: 1,
    type: "textarea",
    question: "Existe alguma condição que o plano precisa respeitar e que ainda não apareceu?",
    helper: "Por exemplo: equipamento, acessibilidade, deslocamento, responsabilidade familiar, saúde, compromisso profissional ou uma data importante.",
    optional: true,
    maxChars: 600,
    path: ["condicaoAdicionalExecucao"],
  },
];

export function getStepBySlug(slug: string) {
  return ADEQUACAO_STEPS.find((s) => s.slug === slug);
}

export function getStepIndex(slug: string) {
  return ADEQUACAO_STEPS.findIndex((s) => s.slug === slug);
}

export function getNextSlug(slug: string): string | null {
  const idx = getStepIndex(slug);
  if (idx === -1 || idx === ADEQUACAO_STEPS.length - 1) return null;
  return ADEQUACAO_STEPS[idx + 1].slug;
}

export function getPrevSlug(slug: string): string | null {
  const idx = getStepIndex(slug);
  if (idx <= 0) return null;
  return ADEQUACAO_STEPS[idx - 1].slug;
}

export const TOTAL_STEPS = ADEQUACAO_STEPS.length;

export function getResumeSlug(answers: Record<string, unknown> | null | undefined): string {
  for (const step of ADEQUACAO_STEPS) {
    if (step.type === "intention") continue; // não usado aqui, só pra manter o tipo genérico
    const value = deepGetLocal(answers, step.path);
    const isEmpty = value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
    const isOptional = "optional" in step && step.optional;
    if (!isOptional && isEmpty) {
      return step.slug;
    }
  }
  return "concluido";
}

function deepGetLocal(obj: Record<string, unknown> | null | undefined, path: string[]): unknown {
  let cursor: unknown = obj ?? {};
  for (const key of path) {
    if (cursor == null || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return cursor;
}
