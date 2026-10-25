// Questionário de execução — curto (3 perguntas), feito depois que o professor escolhe
// um negócio e antes de gerar o plano. Desde out/2026 não há mais semanas, ritmo,
// distribuição de tempo, regra financeira, ações aceitas nem check-in: o plano é uma
// lista de ações no ritmo da pessoa. As horas por semana servem só para julgar se o
// plano CABE na vida dela. Os `value` das opções de escolha única batem com os enums
// Prisma (EstagioInicial, OrcamentoFaixa), para não precisar de remapeamento.
import type { WizardStep } from "@/lib/wizard/step-types";

export const ADEQUACAO_STEPS: WizardStep[] = [
  {
    slug: "estagio-inicial",
    block: 1,
    type: "single-select",
    question: "Em que ponto você está em relação a este negócio?",
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
    question: "Quantas horas por semana você consegue reservar para colocar este negócio em prática?",
    helper:
      "Considere uma média sustentável, não uma semana excepcional. Você seguirá o plano no seu ritmo; esta resposta só ajuda a ver se o negócio cabe na sua rotina.",
    min: 1,
    max: 40,
    step: 0.5,
    defaultValue: 4,
    path: ["horasSemanaisDisponiveis"],
  },
  {
    slug: "orcamento",
    block: 1,
    type: "single-select",
    question: "Quanto você tem disponível para investir neste plano, se realmente for necessário?",
    helper: "O plano não precisa gastar esse valor. Ele apenas não poderá ultrapassar o limite escolhido.",
    options: [
      { value: "SEM_INVESTIMENTO", label: "Prefiro não investir nada por enquanto." },
      { value: "ATE_300", label: "Até R$300 no total." },
      { value: "DE_300_A_1000", label: "Entre R$300 e R$1.000 no total." },
      { value: "ACIMA_DE_1000", label: "Acima de R$1.000 no total." },
    ],
    path: ["orcamentoTotal12Semanas"],
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
