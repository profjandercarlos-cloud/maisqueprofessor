import type { DiagnosticStep } from "./steps";

// Caso raro — dispara só depois de 3 rodadas de ajuste sem aprovação.
// Conjunto padronizado e fixo, sempre o mesmo (Diagnostico_Perguntas_Finais.md).
export const INCREMENT_STEPS = [
  {
    slug: "incremento-1",
    block: 8,
    type: "textarea",
    question:
      "Das cinco possibilidades que você viu, o que mais te afastou delas — foi o tipo de trabalho, o público, a forma de ganhar dinheiro, ou outra coisa?",
    path: ["incremento", "q1"],
  },
  {
    slug: "incremento-2",
    block: 8,
    type: "textarea",
    question: "Existe algo que você esperava ver e não apareceu em nenhuma das cinco?",
    path: ["incremento", "q2"],
  },
  {
    slug: "incremento-3",
    block: 8,
    type: "textarea",
    question:
      "Pensando nas pessoas que você admira profissionalmente, o que elas têm que você gostaria de ter também?",
    path: ["incremento", "q3"],
  },
  {
    slug: "incremento-4",
    block: 8,
    type: "textarea",
    question: "Existe algo que você faz muito bem, mas nunca pensou em relacionar com trabalho?",
    path: ["incremento", "q4"],
  },
  {
    slug: "incremento-5",
    block: 8,
    type: "textarea",
    question:
      "Qual foi a última vez que alguém te agradeceu por algo que você fez além da sua obrigação — o que era?",
    path: ["incremento", "q5"],
  },
  {
    slug: "incremento-6",
    block: 8,
    type: "textarea",
    question: "Se dinheiro não fosse uma questão, o que você faria com o seu tempo?",
    path: ["incremento", "q6"],
  },
  {
    slug: "incremento-7",
    block: 8,
    type: "textarea",
    question:
      "O que te deixaria orgulhoso de contar para alguém daqui a um ano, sobre um projeto que você tocou?",
    path: ["incremento", "q7"],
  },
  {
    slug: "incremento-8",
    block: 8,
    type: "textarea",
    question:
      'Existe algum tipo de trabalho que você já descartou por achar "não é pra mim" — qual, e por quê?',
    path: ["incremento", "q8"],
  },
  {
    slug: "incremento-9",
    block: 8,
    type: "textarea",
    question:
      "Quando você imagina o seu dia a dia ideal de trabalho, o que está acontecendo às 10h da manhã?",
    path: ["incremento", "q9"],
  },
  {
    slug: "incremento-10",
    block: 8,
    type: "textarea",
    question:
      "O que mais pesou nas suas respostas anteriores: o que você já sabe fazer, ou o que você quer aprender?",
    path: ["incremento", "q10"],
  },
] satisfies DiagnosticStep[];

export function getIncrementStepBySlug(slug: string) {
  return INCREMENT_STEPS.find((s) => s.slug === slug);
}

export function getIncrementStepIndex(slug: string) {
  return INCREMENT_STEPS.findIndex((s) => s.slug === slug);
}

export function getIncrementNextSlug(slug: string): string | null {
  const idx = getIncrementStepIndex(slug);
  if (idx === -1 || idx === INCREMENT_STEPS.length - 1) return null;
  return INCREMENT_STEPS[idx + 1].slug;
}

export function getIncrementPrevSlug(slug: string): string | null {
  const idx = getIncrementStepIndex(slug);
  if (idx <= 0) return null;
  return INCREMENT_STEPS[idx - 1].slug;
}

export const TOTAL_INCREMENT_STEPS = INCREMENT_STEPS.length;
