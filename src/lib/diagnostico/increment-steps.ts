import type { DiagnosticStep } from "./steps";
import { deepGet } from "@/lib/wizard/deep-set";

// Caso raro — dispara só depois de 3 rodadas de ajuste sem aprovação.
// Conjunto padronizado e fixo, sempre o mesmo (Diagnostico_Perguntas_Finais.md).
export const INCREMENT_STEPS = [
  {
    slug: "incremento-1",
    block: 8,
    type: "textarea",
    question:
      "Das cinco possibilidades que você viu, o que mais te afastou delas? Foi o tipo de trabalho, o público, a forma de ganhar dinheiro, ou outra coisa?",
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
      "Qual foi a última vez que alguém te agradeceu por algo que você fez além da sua obrigação? O que era?",
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
      'Existe algum tipo de trabalho que você já descartou por achar "não é pra mim"? Qual, e por quê?',
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

export type SelecaoAjuste = { roundId: string; papeisTrocar: string[] };

export function getSelecaoAjuste(incrementAnswers: unknown): SelecaoAjuste | null {
  const selecao = (incrementAnswers as Record<string, unknown> | null)?.selecaoAjuste as SelecaoAjuste | undefined;
  return selecao && selecao.roundId && Array.isArray(selecao.papeisTrocar) ? selecao : null;
}

function listarComE(itens: string[]): string {
  if (itens.length === 0) return "";
  if (itens.length === 1) return itens[0];
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

// Ajuste seletivo (2026-09): quando a pessoa escolheu manter algumas
// possibilidades e trocar só outras (ver possibilidades/[roundId]/ajustar),
// a 1ª pergunta do incremento passa a citar os títulos reais em vez de
// ficar genérica sobre "as cinco" — pede especificidade por possibilidade
// sem precisar de um conjunto de perguntas por papel.
export function buildContextualQ1(titulosManter: string[], titulosTrocar: string[]): string {
  const parteManter = titulosManter.length > 0 ? `Você decidiu manter ${listarComE(titulosManter)} e trocar ${listarComE(titulosTrocar)}.` : `Você decidiu trocar ${listarComE(titulosTrocar)}.`;
  return `${parteManter} Pra cada uma que você quer trocar, o que especificamente não conversou com você? Foi o tipo de trabalho, o público, a forma de ganhar dinheiro, ou outra coisa?`;
}

// Formata as respostas do incremento como um bloco de texto extra, apenso
// ao final da entrada do diagnóstico — reaproveitado pela fase PENDENTE da
// fila de geração (run-generation-pipeline.ts), já que essa fase só recebe
// o roundId e recalcula tudo a partir do banco. `q1Override` substitui a 1ª
// pergunta genérica pela versão contextualizada do ajuste seletivo, quando
// há uma.
export function buildIncrementoTexto(incrementAnswers: unknown, q1Override?: string): string {
  return INCREMENT_STEPS.map((s) => {
    const answer = deepGet(incrementAnswers as Record<string, unknown> | null, s.path);
    const question = s.slug === "incremento-1" && q1Override ? q1Override : s.question;
    return `${question} ${typeof answer === "string" && answer ? answer : "não informado"}`;
  }).join("\n");
}
