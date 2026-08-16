// Conteúdo transcrito de Diagnostico_Perguntas_Finais.md — não alterar a
// redação das perguntas/opções sem revisar o documento fonte.

export type StepOption = { value: string; label: string };

export type DiagnosticStep =
  | {
      slug: string;
      block: number;
      type: "intention";
      question: string;
      options: StepOption[];
    }
  | {
      slug: string;
      block: number;
      type: "textarea";
      question: string;
      helper?: string;
      placeholder?: string;
      optional?: boolean;
      path: string[];
    }
  | {
      slug: string;
      block: number;
      type: "single-select";
      question: string;
      helper?: string;
      options: StepOption[];
      path: string[];
    }
  | {
      slug: string;
      block: number;
      type: "multi-select";
      question: string;
      helper?: string;
      options: StepOption[];
      minSelect?: number;
      maxSelect?: number;
      path: string[];
    }
  | {
      slug: string;
      block: number;
      type: "situation";
      question: string;
      helper?: string;
      fields: { key: string; label: string }[];
      path: string[];
    }
  | {
      slug: string;
      block: number;
      type: "matrix";
      question: string;
      helper?: string;
      rows: StepOption[];
      levels: StepOption[];
      path: string[];
    };

const CAPACIDADES: StepOption[] = [
  { value: "investigar", label: "Investigar, analisar e perceber padrões" },
  { value: "organizar", label: "Organizar informações, rotinas e conhecimento" },
  { value: "explicar", label: "Explicar ideias com clareza" },
  { value: "escrever", label: "Escrever, narrar e construir argumentos" },
  { value: "orientar", label: "Orientar pessoas e oferecer direção" },
  { value: "vinculos", label: "Criar vínculos, acolher e perceber necessidades" },
  { value: "mediar", label: "Mediar conflitos e construir acordos" },
  { value: "mobilizar", label: "Mobilizar grupos e conduzir projetos" },
  { value: "resolver", label: "Resolver problemas e melhorar processos" },
  { value: "pesquisar", label: "Pesquisar, observar e experimentar" },
  { value: "tecnologia", label: "Usar tecnologia para construir soluções" },
  { value: "criar_visual", label: "Criar visualmente, artisticamente ou com as mãos" },
  { value: "criar_experiencias", label: "Criar materiais, ambientes e experiências" },
  { value: "improvisar", label: "Improvisar e adaptar rapidamente" },
  { value: "corpo", label: "Demonstrar por meio do corpo, movimento ou prática" },
  { value: "incluir", label: "Incluir pessoas e tornar experiências acessíveis" },
];

const SITUATION_FIELDS = [
  { key: "contexto", label: "Qual era o contexto?" },
  { key: "dificuldade", label: "O que estava difícil?" },
  { key: "acao", label: "O que você fez pessoalmente?" },
  { key: "resultado", label: "O que mudou depois?" },
];

export const DIAGNOSTIC_STEPS: DiagnosticStep[] = [
  {
    slug: "intencao",
    block: 0,
    type: "intention",
    question: "O que mais se parece com o que você sente hoje?",
    options: [
      { value: "SAIR", label: "Quero sair da sala de aula" },
      {
        value: "COMPLEMENTAR",
        label: "Quero continuar na educação, mas com uma atividade complementar",
      },
      { value: "NAO_SEI", label: "Ainda não sei — quero enxergar as possibilidades primeiro" },
    ],
  },
  {
    slug: "bloco1-ajuda",
    block: 1,
    type: "textarea",
    question: "Fora da obrigação de ensinar, para que tipo de ajuda as pessoas procuram você?",
    placeholder: "Ex.: organizar, escrever, criar algo visual, ouvir e orientar...",
    path: ["bloco1", "paraQueAjuda"],
  },
  {
    slug: "bloco1-curiosidade",
    block: 1,
    type: "textarea",
    question: "Que assuntos, problemas ou atividades despertam sua curiosidade espontaneamente?",
    placeholder: "Aquilo que você pesquisa ou aprende sem ninguém pedir.",
    path: ["bloco1", "curiosidade"],
  },
  {
    slug: "bloco1-experiencias",
    block: 1,
    type: "textarea",
    question: "Que experiências fora da docência também fazem parte da sua trajetória?",
    placeholder: "Projetos pessoais, cuidado, trabalho anterior, negócio...",
    optional: true,
    path: ["bloco1", "experienciasForaDaDocencia"],
  },
  {
    slug: "bloco2-situacao-1",
    block: 2,
    type: "situation",
    question: "Situação 1 — conte uma situação concreta que mostra como você age",
    helper: "Duas situações concretas mostram melhor como você age do que uma descrição geral.",
    fields: SITUATION_FIELDS,
    path: ["bloco2", "situacao1"],
  },
  {
    slug: "bloco2-situacao-2",
    block: 2,
    type: "situation",
    question: "Situação 2 — conte outra situação concreta, diferente da anterior",
    fields: SITUATION_FIELDS,
    path: ["bloco2", "situacao2"],
  },
  {
    slug: "bloco3-capacidades",
    block: 3,
    type: "multi-select",
    question: "Quais capacidades representam seu jeito de agir?",
    helper: "Escolha de 3 a 8.",
    options: CAPACIDADES,
    minSelect: 3,
    maxSelect: 8,
    path: ["bloco3", "capacidades"],
  },
  {
    slug: "bloco4-problema",
    block: 4,
    type: "multi-select",
    question: "Que tipo de problema mobiliza você?",
    options: [
      { value: "situacoes_confusas", label: "Situações confusas ou difíceis de compreender" },
      { value: "decisoes_sem_info", label: "Decisões tomadas sem informações claras" },
      { value: "processos_desorganizados", label: "Processos desorganizados ou que não funcionam" },
      { value: "ideias_que_nao_chegam", label: "Ideias que não conseguem chegar às pessoas" },
      { value: "pessoas_precisam_orientacao", label: "Pessoas que precisam de orientação ou desenvolvimento" },
      { value: "conflitos", label: "Conflitos e relações desgastadas" },
      { value: "experiencias_pouco_envolventes", label: "Experiências pouco envolventes ou significativas" },
      { value: "barreiras_acesso", label: "Barreiras de acesso, participação ou compreensão" },
      { value: "grupos_pouco_conectados", label: "Grupos pouco conectados ou mobilizados" },
      { value: "solucao_digital", label: "Problemas que podem receber uma solução digital" },
    ],
    minSelect: 1,
    path: ["bloco4", "tipoDeProblema"],
  },
  {
    slug: "bloco4-valor",
    block: 4,
    type: "multi-select",
    question: "Que forma de valor você gostaria de produzir?",
    options: [
      { value: "clareza", label: "Gerar clareza para compreender ou decidir" },
      { value: "estrutura", label: "Criar estrutura, organização e continuidade" },
      { value: "solucao_concreta", label: "Construir uma solução concreta que funcione" },
      { value: "comunicar", label: "Comunicar, sensibilizar ou contar histórias" },
      { value: "autonomia", label: "Ajudar pessoas a desenvolver autonomia" },
      { value: "acolhimento", label: "Criar acolhimento, vínculo e pertencimento" },
      { value: "experiencia_pratica", label: "Criar uma experiência prática ou memorável" },
      { value: "ampliar_acesso", label: "Ampliar acesso, inclusão e participação" },
    ],
    minSelect: 1,
    path: ["bloco4", "formaDeValor"],
  },
  {
    slug: "bloco5-aprofundar",
    block: 5,
    type: "textarea",
    question: "O que faz você ter vontade de aprofundar, investigar ou construir?",
    placeholder: "Não precisa ser algo que você já saiba fazer.",
    path: ["bloco5", "aprofundar"],
  },
  {
    slug: "bloco5-areas",
    block: 5,
    type: "multi-select",
    question: "Em quais áreas você aceitaria aprender algo novo?",
    options: [
      { value: "negocios", label: "Negócios e modelos de receita" },
      { value: "tecnologia", label: "Tecnologia e ferramentas digitais" },
      { value: "dados", label: "Dados, pesquisa e inteligência" },
      { value: "gestao", label: "Gestão de produtos e projetos" },
      { value: "processos", label: "Processos e operações" },
      { value: "comunicacao", label: "Comunicação, escrita e conteúdo" },
      { value: "design", label: "Design visual e experiências" },
      { value: "facilitacao", label: "Facilitação e relações humanas" },
      { value: "inclusao", label: "Inclusão e acessibilidade" },
      { value: "cultura", label: "Cultura, eventos e projetos sociais" },
    ],
    minSelect: 1,
    path: ["bloco5", "areasDeAprendizado"],
  },
  {
    slug: "bloco5-inspiracao",
    block: 5,
    type: "textarea",
    question:
      "Existe algum produto, serviço, negócio ou empresa que desperte em você a sensação de \"eu gostaria de construir algo desse tipo\"?",
    helper:
      "O que exatamente chama sua atenção: o que a empresa faz, como cria valor, como entrega, como ganha dinheiro, como cresce?",
    optional: true,
    path: ["bloco5", "inspiracao"],
  },
  {
    slug: "bloco6-mudanca",
    block: 6,
    type: "multi-select",
    question: "O que você deseja mudar na vida profissional?",
    options: [
      { value: "autonomia_decidir", label: "Mais autonomia para decidir como trabalhar" },
      { value: "retorno_crescimento", label: "Maior retorno e possibilidade de crescimento" },
      { value: "crescer_sem_horas", label: "Crescer sem depender apenas de mais horas" },
      { value: "flexibilidade", label: "Flexibilidade de horários e localização" },
      { value: "projetos_com_fim", label: "Projetos com começo, meio e fim" },
      { value: "construir_em_equipe", label: "Construir algo em equipe" },
      { value: "significado", label: "Maior significado e conexão com o trabalho" },
      { value: "rotina_pratica", label: "Rotina mais prática, dinâmica ou manual" },
    ],
    minSelect: 1,
    path: ["bloco6", "mudancaDesejada"],
  },
  {
    slug: "bloco6-distancia",
    block: 6,
    type: "single-select",
    question: "Que distância você deseja manter da educação?",
    options: [
      { value: "explorar_outros_setores", label: "Quero explorar outros setores" },
      { value: "aceito_proximo", label: "Aceito algo próximo da educação" },
      { value: "aberto_as_duas", label: "Estou aberto às duas direções" },
    ],
    path: ["bloco6", "distanciaDaEducacao"],
  },
  {
    slug: "bloco6-formatos",
    block: 6,
    type: "multi-select",
    question: "Quais formatos você aceitaria considerar?",
    helper: "Pode marcar mais de um.",
    options: [
      { value: "empresa", label: "Empresa ou organização" },
      { value: "projetos_escopo", label: "Projetos com escopo definido" },
      { value: "consultoria", label: "Consultoria ou serviço especializado" },
      { value: "produto_digital", label: "Produto digital replicável" },
      { value: "negocio_proprio", label: "Negócio próprio" },
      { value: "conteudo_autoral", label: "Conteúdo ou publicação autoral" },
      { value: "comunidades", label: "Comunidades e experiências coletivas" },
    ],
    minSelect: 1,
    path: ["bloco6", "formatosAceitos"],
  },
  {
    slug: "bloco6-vida-desejada",
    block: 6,
    type: "textarea",
    question: "Como seria a vida profissional desejada?",
    optional: true,
    path: ["bloco6", "vidaDesejada"],
  },
  {
    slug: "bloco6-investimento",
    block: 6,
    type: "single-select",
    question:
      "Imagine um projeto paralelo que exigisse entre R$300 e R$1.000 e algumas horas por semana, sem garantia de dar certo. Se a ideia fizesse sentido pra você, qual seria sua reação?",
    options: [
      { value: "testaria_de_imediato", label: "Testaria de imediato" },
      { value: "testaria_apos_planejar", label: "Testaria depois de pesquisar e planejar" },
      { value: "provavelmente_nao_testaria", label: "Provavelmente não testaria" },
    ],
    path: ["bloco6", "reacaoInvestimento"],
  },
  {
    slug: "bloco7-limites",
    block: 7,
    type: "matrix",
    question: "Como cada condição pesa para você?",
    rows: [
      { value: "horariosRigidos", label: "Horários rígidos e pouca autonomia" },
      { value: "atendimentoConstante", label: "Atendimento constante" },
      { value: "exposicaoPublica", label: "Exposição pública frequente" },
      { value: "vendas", label: "Vendas e prospecção ativa" },
      { value: "tarefasRepetitivas", label: "Tarefas muito repetitivas" },
      { value: "produtosFisicos", label: "Produzir ou enviar produtos físicos" },
      { value: "deslocamentos", label: "Deslocamentos ou viagens frequentes" },
      { value: "formacaoLonga", label: "Formação longa antes de experimentar" },
    ],
    levels: [
      { value: "nao_incomoda", label: "Não me incomoda" },
      { value: "prefiro_evitar", label: "Prefiro evitar" },
      { value: "nao_aceito", label: "Não aceito" },
    ],
    path: ["bloco7", "limites"],
  },
  {
    slug: "bloco7-limite-adicional",
    block: 7,
    type: "textarea",
    question: "Existe algum limite importante que não apareceu?",
    optional: true,
    path: ["bloco7", "limiteAdicional"],
  },
];

export function getStepBySlug(slug: string) {
  return DIAGNOSTIC_STEPS.find((s) => s.slug === slug);
}

export function getStepIndex(slug: string) {
  return DIAGNOSTIC_STEPS.findIndex((s) => s.slug === slug);
}

export function getNextSlug(slug: string): string | null {
  const idx = getStepIndex(slug);
  if (idx === -1 || idx === DIAGNOSTIC_STEPS.length - 1) return null;
  return DIAGNOSTIC_STEPS[idx + 1].slug;
}

export function getPrevSlug(slug: string): string | null {
  const idx = getStepIndex(slug);
  if (idx <= 0) return null;
  return DIAGNOSTIC_STEPS[idx - 1].slug;
}

export const TOTAL_STEPS = DIAGNOSTIC_STEPS.length;

// Acha a primeira etapa ainda não respondida, para retomar de onde parou.
// A intenção (Bloco 0) nasce com um valor padrão ("NAO_SEI"), então só a
// consideramos "não respondida" se nada depois dela também foi preenchido.
export function getResumeSlug(
  intention: string,
  answers: Record<string, unknown> | null | undefined,
): string {
  for (const step of DIAGNOSTIC_STEPS) {
    if (step.type === "intention") {
      const nextStep = DIAGNOSTIC_STEPS[1];
      const nextAnswered = deepGetLocal(answers, nextStep.type === "intention" ? [] : nextStep.path);
      if (intention === "NAO_SEI" && (nextAnswered === undefined || nextAnswered === "")) {
        return step.slug;
      }
      continue;
    }
    const value = deepGetLocal(answers, step.path);
    const isEmpty =
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0) ||
      (step.type === "situation" &&
        (!value || step.fields.some((f) => !(value as Record<string, string>)[f.key])));
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
