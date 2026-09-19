import type { DiagnosticStep } from "./steps";
import { deepGet } from "@/lib/wizard/deep-set";
import { otherDetailPath } from "@/lib/wizard/step-types";

// Dispara depois de uma rodada de ajuste sem aprovacao (ver
// possibilidades/[roundId]/ajustar). Conjunto padronizado e fixo, sempre o
// mesmo. Reformulado em 2026-09 depois de um teste real: 5 das 10 perguntas
// originais (todas dissertativas) renderam pouco ou nenhum sinal aproveitado
// pela geracao (ex.: "ultima vez que te agradeceram" e "10h da manha no dia
// ideal" viraram respostas sem conexao com nenhuma possibilidade gerada).
// Mantem as 5 dissertativas que de fato geraram conteudo usado, e substitui
// as outras 5 por perguntas objetivas (single/multi-select, mesmo componente
// do questionario principal) intercaladas com as dissertativas - reduz
// fadiga de digitar e da sinal estruturado (dominio/mecanismo/ritmo) sem
// enviesar a IA para uma direcao especifica de negocio.
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
    type: "multi-select",
    question: "O que mais te afastou das que você quer trocar?",
    helper: "Escolha até três.",
    options: [
      { value: "tipo_trabalho", label: "O tipo de trabalho no dia a dia." },
      { value: "quem_compraria", label: "Quem compraria." },
      { value: "forma_cobranca", label: "A forma de cobrar e ganhar dinheiro." },
      { value: "potencial_crescimento", label: "O potencial de crescimento." },
      { value: "outro", label: "Outra coisa" },
    ],
    minSelect: 1,
    maxSelect: 3,
    allowOther: true,
    path: ["incremento", "q2"],
  },
  {
    slug: "incremento-3",
    block: 8,
    type: "textarea",
    question:
      "O que te deixaria orgulhoso de contar para alguém daqui a um ano, sobre um projeto que você tocou?",
    path: ["incremento", "q3"],
  },
  {
    slug: "incremento-4",
    block: 8,
    type: "single-select",
    question: "Que ritmo de crescimento você prefere?",
    options: [
      { value: "pequeno_seguro", label: "Começar pequeno e crescer aos poucos, com segurança." },
      { value: "apostar_alto", label: "Apostar mais alto desde o início, mesmo com mais risco." },
      { value: "sem_preferencia", label: "Sem preferência clara, quero ver o que faz mais sentido." },
    ],
    path: ["incremento", "q4"],
  },
  {
    slug: "incremento-5",
    block: 8,
    type: "textarea",
    question:
      'Existe algum tipo de trabalho que você já descartou por achar "não é pra mim"? Qual, e por quê?',
    path: ["incremento", "q5"],
  },
  {
    slug: "incremento-6",
    block: 8,
    type: "single-select",
    question: "Que estilo de trabalho mais combina com você?",
    options: [
      { value: "liderar_decisoes", label: "Liderar decisões estratégicas." },
      { value: "executar_autonomo", label: "Executar com autonomia, sozinho." },
      { value: "colaborar_equipe", label: "Colaborar em equipe." },
      { value: "atender_clientes", label: "Atender clientes diretamente." },
      { value: "criar_conteudo", label: "Criar conteúdo e comunicar." },
      { value: "analisar_dados", label: "Analisar dados e otimizar processos." },
    ],
    path: ["incremento", "q6"],
  },
  {
    slug: "incremento-7",
    block: 8,
    type: "textarea",
    question:
      "Pensando nas pessoas que você admira profissionalmente, o que elas têm que você gostaria de ter também?",
    path: ["incremento", "q7"],
  },
  {
    slug: "incremento-8",
    block: 8,
    type: "multi-select",
    question: "O que mais desperta seu interesse?",
    helper: "Escolha até três.",
    options: [
      { value: "ganhar_dinheiro", label: "Ganhar muito dinheiro." },
      { value: "liberdade_horario", label: "Ter liberdade de horário." },
      { value: "construir_algo_proprio", label: "Construir algo com meu nome." },
      { value: "ajudar_pessoas", label: "Ajudar pessoas diretamente." },
      { value: "resolver_problemas", label: "Resolver problemas complexos." },
      { value: "aprender_coisas_novas", label: "Aprender coisas novas constantemente." },
    ],
    minSelect: 1,
    maxSelect: 3,
    path: ["incremento", "q8"],
  },
  {
    slug: "incremento-9",
    block: 8,
    type: "textarea",
    question: "Existe algo que você faz muito bem, mas nunca pensou em relacionar com trabalho?",
    path: ["incremento", "q9"],
  },
  {
    slug: "incremento-10",
    block: 8,
    type: "single-select",
    question: "O que deve pesar mais nas próximas cinco: o que você já sabe fazer, ou o que você quer aprender?",
    options: [
      { value: "so_saber_fazer", label: "Sobretudo o que já sei fazer." },
      { value: "mais_saber_fazer", label: "Um pouco mais o que já sei, mas com abertura pra aprender." },
      { value: "equilibrio", label: "Equilíbrio entre os dois." },
      { value: "mais_aprender", label: "Um pouco mais o que quero aprender." },
      { value: "so_aprender", label: "Sobretudo o que quero aprender." },
    ],
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
  const parteManter =
    titulosManter.length > 0
      ? `Você decidiu manter ${listarComE(titulosManter)} e trocar ${listarComE(titulosTrocar)}.`
      : `Você decidiu trocar ${listarComE(titulosTrocar)}.`;
  return `${parteManter} Pra cada uma que você quer trocar, o que especificamente não conversou com você? Foi o tipo de trabalho, o público, a forma de ganhar dinheiro, ou outra coisa?`;
}

// Converte a resposta bruta salva (string, array, ou objeto de "outro") de
// cada tipo de pergunta num texto legível pra IA — respostas de
// single/multi-select vêm como value(s) do StepOption, não o label; sem
// resolver isso, o texto final mostraria "tipo_trabalho" em vez de "O tipo
// de trabalho no dia a dia."
function formatIncrementAnswer(step: DiagnosticStep, incrementAnswers: unknown): string {
  const raw = incrementAnswers as Record<string, unknown> | null;

  switch (step.type) {
    case "textarea": {
      const answer = deepGet(raw, step.path);
      return typeof answer === "string" && answer ? answer : "não informado";
    }
    case "single-select": {
      const answer = deepGet(raw, step.path);
      if (typeof answer !== "string" || !answer) return "não informado";
      const label = step.options.find((o) => o.value === answer)?.label ?? answer;
      if (answer === "outro" && step.allowOther) {
        const detalhe = deepGet(raw, otherDetailPath(step.path));
        if (typeof detalhe === "string" && detalhe) return `${label} ${detalhe}`;
      }
      return label;
    }
    case "multi-select": {
      const answer = deepGet(raw, step.path);
      if (!Array.isArray(answer) || answer.length === 0) return "não informado";
      const labels = answer.map((v) => step.options.find((o) => o.value === v)?.label ?? String(v));
      return labels.join("; ");
    }
    default:
      return "não informado";
  }
}

// Formata as respostas do incremento como um bloco de texto extra, apenso
// ao final da entrada do diagnóstico — reaproveitado pela fase PENDENTE da
// fila de geração (run-generation-pipeline.ts), já que essa fase só recebe
// o roundId e recalcula tudo a partir do banco. `q1Override` substitui a 1ª
// pergunta genérica pela versão contextualizada do ajuste seletivo, quando
// há uma.
export function buildIncrementoTexto(incrementAnswers: unknown, q1Override?: string): string {
  return INCREMENT_STEPS.map((s) => {
    const question = s.slug === "incremento-1" && q1Override ? q1Override : s.question;
    return `${question} ${formatIncrementAnswer(s, incrementAnswers)}`;
  }).join("\n");
}
