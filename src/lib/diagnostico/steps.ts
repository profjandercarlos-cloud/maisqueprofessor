// Conteúdo transcrito de Questionario_Descoberta_Unificado_MaisQueProfessor.docx
// — não alterar a redação das perguntas/opções sem revisar o documento fonte.
//
// Estrutura: 20 perguntas comuns (Blocos A-D) + um bloco condicional de 2-3
// perguntas que muda conforme a rota profissional escolhida na Pergunta 2
// (rota_profissional). Como a rota é respondida bem no início do bloco
// comum, ela sempre já é conhecida antes de chegar no bloco condicional —
// por isso a navegação (getNextSlug/getPrevSlug/getResumeSlug) resolve a
// lista efetiva de steps via getStepsForRoute(rota) em vez de depender de
// um array fixo único.

import type { RotaProfissional } from "@/generated/prisma/client";
import type { StepOption, WizardStep } from "@/lib/wizard/step-types";
import { deepGet } from "@/lib/wizard/deep-set";

export type { WizardStep as DiagnosticStep };

export const ROTA_PROFISSIONAL_SLUG = "rota-profissional";

const CAPACIDADES: StepOption[] = [
  { value: "investigar", label: "Investigar, analisar e perceber padrões" },
  { value: "organizar", label: "Organizar informações, rotinas e conhecimento" },
  { value: "explicar", label: "Explicar ideias com clareza" },
  { value: "escrever", label: "Escrever, narrar e construir argumentos" },
  { value: "pesquisar", label: "Pesquisar, observar e experimentar" },
  { value: "orientar", label: "Orientar pessoas e oferecer direção" },
  { value: "vinculos", label: "Criar vínculos, acolher e perceber necessidades" },
  { value: "resolver", label: "Resolver problemas e melhorar processos" },
  { value: "planejar", label: "Planejar e acompanhar projetos" },
  { value: "liderar", label: "Liderar e mobilizar grupos" },
  { value: "improvisar", label: "Improvisar e adaptar rapidamente" },
  { value: "numeros", label: "Trabalhar com números e dados" },
  { value: "tecnologia", label: "Usar tecnologia para construir soluções" },
  { value: "criar_visual", label: "Criar visualmente ou produzir com as mãos" },
  { value: "negociar", label: "Negociar, comparar alternativas e tomar decisões" },
  { value: "outro", label: "Outra" },
];

const SITUATION_FIELDS_1 = [
  { key: "situacao", label: "O que estava acontecendo?", minChars: 50, maxChars: 500 },
  { key: "acao", label: "O que você fez, decidiu, organizou, criou ou mudou?", minChars: 80, maxChars: 800 },
  { key: "resultado", label: "O que mudou depois da sua ação?", minChars: 40, maxChars: 500 },
];

export const SHARED_STEPS: WizardStep[] = [
  // ===== Bloco A — Direção da busca =====
  {
    slug: "intencao",
    block: 1,
    type: "intention",
    question: "O que você deseja em relação à sala de aula neste momento?",
    options: [
      { value: "SAIR", label: "Quero construir uma saída da sala de aula." },
      { value: "COMPLEMENTAR", label: "Quero continuar na educação, mas desenvolver outra atividade." },
      { value: "NAO_SEI", label: "Ainda não sei se quero sair." },
      { value: "JA_FORA_DA_SALA", label: "Já estou fora da sala de aula e quero encontrar uma nova direção." },
    ],
  },
  {
    slug: ROTA_PROFISSIONAL_SLUG,
    block: 1,
    type: "single-select",
    question: "Qual destas buscas representa melhor o que você deseja agora?",
    options: [
      {
        value: "CARREIRA",
        label:
          "Quero construir uma nova carreira. Quero encontrar uma profissão, função, setor ou ambiente de trabalho para o qual eu possa migrar.",
      },
      {
        value: "CRIACAO_VALOR",
        label:
          "Quero criar uma nova forma de atuação. Quero transformar minhas capacidades em serviços, produtos, ferramentas, conteúdo ou negócio.",
      },
      {
        value: "EXPLORACAO",
        label: "Ainda não sei. Quero conhecer possibilidades dos dois tipos antes de decidir.",
      },
    ],
    path: ["blocoA", "rotaProfissional"],
  },
  {
    slug: "distancia-educacao",
    block: 1,
    type: "single-select",
    question: "Quão perto ou longe da educação você quer que as possibilidades estejam?",
    options: [
      { value: "completamente_fora", label: "Quero possibilidades completamente fora da educação." },
      { value: "proximas_fora_sala", label: "Aceito áreas próximas da educação, mas fora da sala de aula." },
      { value: "dentro_e_fora", label: "Aceito possibilidades dentro e fora da educação." },
      { value: "evidencias_decidem", label: "Ainda não sei; prefiro deixar as evidências decidirem." },
    ],
    path: ["blocoA", "distanciaEducacao"],
  },
  {
    slug: "mudancas-prioritarias",
    block: 1,
    type: "multi-select",
    question: "O que você mais deseja mudar na sua vida profissional?",
    helper: "Escolha até três prioridades.",
    options: [
      { value: "crescimento", label: "Ter maior possibilidade de crescimento." },
      { value: "remoto", label: "Trabalhar de onde eu quiser ou ter mais possibilidade de trabalho remoto." },
      { value: "autonomia", label: "Ter mais autonomia." },
      { value: "rotina_dinamica", label: "Ter uma rotina mais dinâmica." },
      { value: "estabilidade", label: "Ter mais estabilidade e previsibilidade." },
      { value: "trabalhar_com_pessoas", label: "Trabalhar mais com outras pessoas." },
      { value: "atividade_pratica", label: "Fazer uma atividade mais prática ou manual." },
      { value: "significado", label: "Encontrar mais significado e conexão no trabalho." },
      { value: "construir_algo_meu", label: "Construir algo meu." },
      { value: "outro", label: "Outro" },
    ],
    minSelect: 1,
    maxSelect: 3,
    allowOther: true,
    path: ["blocoA", "mudancasPrioritarias"],
  },

  // ===== Bloco B — Evidências reais =====
  {
    slug: "ajuda-procurada",
    block: 2,
    type: "textarea",
    question: "Fora da obrigação de dar aulas, para que tipo de ajuda as pessoas costumam procurar você?",
    helper: "Pense em colegas, familiares, amigos, organizações, negócios ou projetos. Diga o que pedem e o que você costuma fazer.",
    minChars: 80,
    maxChars: 900,
    path: ["blocoB", "ajudaProcurada"],
  },
  {
    slug: "experiencias-alem-docencia",
    block: 2,
    type: "textarea",
    question: "Que experiências você já teve além da docência?",
    helper: "Podem ser trabalhos anteriores, negócio próprio, voluntariado, projeto pessoal, atividade comunitária, produção de conteúdo, hobby com resultado concreto ou colaboração em negócio de outra pessoa.",
    minChars: 40,
    maxChars: 1200,
    allowSkipWithCheckbox: "Não tive experiências relevantes além da docência",
    path: ["blocoB", "experienciasAlemDocencia"],
  },
  {
    slug: "situacao-real-1",
    block: 2,
    type: "situation",
    question: "Conte uma situação real em que você resolveu um problema ou melhorou alguma coisa.",
    fields: SITUATION_FIELDS_1,
    path: ["blocoB", "situacaoReal1"],
  },
  {
    slug: "situacao-real-2",
    block: 2,
    type: "situation",
    question: "Agora conte outra situação real, diferente da anterior.",
    helper: "Prefira um contexto, tipo de problema ou público diferente. Isso ajuda a separar uma capacidade transferível de um acontecimento isolado.",
    fields: SITUATION_FIELDS_1,
    rejectIfSameAs: ["blocoB", "situacaoReal1"],
    path: ["blocoB", "situacaoReal2"],
  },
  {
    slug: "capacidades-selecionadas",
    block: 2,
    type: "multi-select",
    question: "Quais destas capacidades você reconhece nas situações que contou?",
    helper: "Escolha no máximo oito. A seleção ajuda a organizar a leitura, mas os exemplos concretos continuam tendo mais peso.",
    options: CAPACIDADES,
    minSelect: 3,
    maxSelect: 8,
    allowOther: true,
    path: ["blocoB", "capacidadesSelecionadas"],
  },
  {
    slug: "contribuicao-diferenciada",
    block: 2,
    type: "textarea",
    question: "O que você costuma fazer melhor ou de maneira mais útil do que as pessoas ao seu redor?",
    helper: 'Descreva uma ação observável. Evite responder apenas com qualidades como "sou criativo" ou "sou responsável".',
    minChars: 60,
    maxChars: 700,
    path: ["blocoB", "contribuicaoDiferenciada"],
  },

  // ===== Bloco C — Interesses e mobilização =====
  {
    slug: "curiosidade-espontanea",
    block: 3,
    type: "textarea",
    question: "Sobre quais assuntos, atividades ou problemas você pesquisa espontaneamente?",
    minChars: 40,
    maxChars: 700,
    path: ["blocoC", "curiosidadeEspontanea"],
  },
  {
    slug: "problemas-mobilizadores",
    block: 3,
    type: "multi-select",
    question: "Que tipos de problema mais despertam sua vontade de resolver?",
    helper: "Escolha até cinco.",
    options: [
      { value: "situacoes_confusas", label: "Situações confusas ou difíceis de compreender." },
      { value: "decisoes_sem_info", label: "Decisões que precisam de informação." },
      { value: "processos_desorganizados", label: "Processos desorganizados ou com desperdício." },
      { value: "ideias_que_nao_chegam", label: "Ideias que não conseguem chegar às pessoas." },
      { value: "barreiras_acesso", label: "Barreiras de acesso, participação ou compreensão." },
      { value: "pessoas_precisam_desenvolver", label: "Pessoas ou equipes que precisam desenvolver capacidades." },
      { value: "produtos_servicos_ruins", label: "Produtos ou serviços que poderiam funcionar melhor." },
      { value: "problemas_administrativos", label: "Problemas administrativos, financeiros ou de organização." },
      { value: "experiencias_pouco_envolventes", label: "Experiências pouco envolventes ou pouco significativas." },
      { value: "grupos_pouco_conectados", label: "Grupos pouco conectados ou mobilizados." },
      { value: "solucao_digital", label: "Problemas que podem receber uma solução digital." },
      { value: "problemas_de_campo", label: "Problemas práticos que exigem execução de campo." },
      { value: "outro", label: "Outro" },
    ],
    minSelect: 2,
    maxSelect: 5,
    allowOther: true,
    path: ["blocoC", "problemasMobilizadores"],
  },
  {
    slug: "resultados-satisfacao",
    block: 3,
    type: "multi-select",
    question: "Que tipo de resultado faz você sentir que seu trabalho valeu a pena?",
    helper: "Escolha até quatro.",
    options: [
      { value: "fazer_compreender", label: "Fazer alguém compreender algo." },
      { value: "ajudar_decidir", label: "Ajudar alguém a tomar uma decisão." },
      { value: "colocar_em_ordem", label: "Colocar algo em ordem." },
      { value: "melhorar_processo", label: "Melhorar um processo." },
      { value: "solucao_pratica", label: "Encontrar uma solução prática." },
      { value: "criar_algo_novo", label: "Criar algo novo." },
      { value: "experiencia_memoravel", label: "Criar uma experiência agradável ou memorável." },
      { value: "ver_funcionando", label: "Ver algo que produzi funcionando." },
      { value: "autonomia_outrem", label: "Ajudar alguém a ganhar autonomia." },
      { value: "grupo_funcionar_melhor", label: "Fazer um grupo funcionar melhor." },
      { value: "ampliar_acesso", label: "Ampliar acesso, segurança ou participação." },
      { value: "outro", label: "Outro" },
    ],
    minSelect: 1,
    maxSelect: 4,
    allowOther: true,
    path: ["blocoC", "resultadosSatisfacao"],
  },
  {
    slug: "aprendizado-desejado",
    block: 3,
    type: "textarea",
    question: "O que você teria vontade de aprender se enxergasse uma aplicação profissional concreta?",
    helper:
      "Pense em algo específico — uma ferramenta, técnica, área de conhecimento ou habilidade — que você aceitaria estudar se soubesse exatamente para que trabalho ela serviria. Não precisa ser algo que você já sabe fazer.",
    minChars: 50,
    maxChars: 700,
    path: ["blocoC", "aprendizadoDesejado"],
  },
  {
    slug: "areas-para-aprender",
    block: 3,
    type: "multi-select",
    question: "Em quais áreas você aceitaria estudar ou desenvolver novas competências?",
    helper: "Escolha até seis.",
    options: [
      { value: "negocios", label: "Negócios, administração e empreendedorismo." },
      { value: "tecnologia", label: "Tecnologia, automação e inteligência artificial." },
      { value: "dados", label: "Dados, pesquisa e inteligência." },
      { value: "gestao", label: "Gestão de produtos e projetos." },
      { value: "processos", label: "Processos e operações." },
      { value: "marketing", label: "Marketing, comunicação e vendas." },
      { value: "escrita", label: "Escrita, conteúdo e produção editorial." },
      { value: "design", label: "Design, criação visual e experiência do usuário." },
      { value: "financas", label: "Finanças e organização de negócios." },
      { value: "relacoes_humanas", label: "Relações humanas, atendimento e experiência do cliente." },
      { value: "inclusao", label: "Inclusão e acessibilidade." },
      { value: "cultura", label: "Cultura, eventos e produção criativa." },
      { value: "ciencias_qualidade", label: "Ciências, qualidade, ambiente e atividades técnicas." },
      { value: "outro", label: "Outra" },
    ],
    minSelect: 1,
    maxSelect: 6,
    allowOther: true,
    path: ["blocoC", "areasParaAprender"],
  },
  {
    slug: "referencia-inspiradora",
    block: 3,
    type: "textarea",
    question: "Existe alguma profissão, empresa, produto, serviço ou projeto que desperte sua curiosidade? O que chama sua atenção?",
    optional: true,
    maxChars: 600,
    path: ["blocoC", "referenciaInspiradora"],
  },

  // ===== Bloco D — Futuro profissional =====
  {
    slug: "vida-profissional-desejada",
    block: 4,
    type: "textarea",
    question: "Como você gostaria que fosse sua vida profissional daqui a alguns anos?",
    helper: "Fale sobre rotina, autonomia, estabilidade, ambiente, pessoas, crescimento, tipo de atividade e resultado que gostaria de produzir.",
    minChars: 100,
    maxChars: 1200,
    path: ["blocoD", "vidaProfissionalDesejada"],
  },
  {
    slug: "formatos-aceitos",
    block: 4,
    type: "multi-select",
    question: "Quais formas de trabalho você aceitaria considerar?",
    helper: "Escolha até seis.",
    options: [
      { value: "empresa_privada", label: "Emprego em empresa privada." },
      { value: "setor_publico", label: "Carreira ou emprego no setor público." },
      { value: "organizacao_social", label: "Trabalho em organização social ou associação." },
      { value: "autonomo", label: "Trabalho autônomo." },
      { value: "projeto", label: "Prestação de serviços por projeto." },
      { value: "consultoria", label: "Consultoria ou serviço especializado." },
      { value: "produto_proprio", label: "Produto próprio físico ou digital." },
      { value: "negocio_proprio", label: "Negócio próprio." },
      { value: "conteudo", label: "Conteúdo, publicação ou assinatura." },
      { value: "ferramenta_digital", label: "Ferramenta digital ou software." },
      { value: "presencial", label: "Trabalho presencial." },
      { value: "hibrido", label: "Trabalho híbrido." },
      { value: "remoto", label: "Trabalho remoto." },
    ],
    minSelect: 1,
    maxSelect: 6,
    path: ["blocoD", "formatosAceitos"],
  },
  {
    slug: "preferencias-estruturais",
    block: 4,
    type: "matrix",
    question: "O que você não quer que faça parte da sua próxima vida profissional?",
    helper: "Classifique apenas preferências duradouras. Condições temporárias, como falta de tempo ou dinheiro hoje, serão tratadas depois.",
    rows: [
      { value: "atendimentoConstante", label: "Atendimento constante ao público." },
      { value: "exposicaoPublica", label: "Exposição pública frequente." },
      { value: "vendas", label: "Vendas e prospecção ativa." },
      { value: "rendaVariavel", label: "Renda predominantemente variável." },
      { value: "rotinaRepetitiva", label: "Rotina muito repetitiva." },
      { value: "trabalhoSentado", label: "Trabalho predominantemente sentado." },
      { value: "atividadeFisica", label: "Atividade predominantemente física." },
      { value: "horarioNoturnoFimSemana", label: "Trabalho frequente à noite ou aos finais de semana." },
      { value: "deslocamentos", label: "Deslocamentos ou viagens frequentes." },
      { value: "horariosRigidos", label: "Horários muito rígidos e pouca autonomia." },
      { value: "trabalhoSozinho", label: "Trabalho predominantemente sozinho." },
      { value: "gestaoEquipesGrandes", label: "Gestão de equipes grandes." },
    ],
    levels: [
      { value: "nao_incomoda", label: "Não me incomoda" },
      { value: "prefiro_evitar", label: "Prefiro evitar" },
      { value: "nao_aceito", label: "Não aceito" },
    ],
    path: ["blocoD", "preferenciasEstruturais"],
  },
  {
    slug: "hipotese-imaginada",
    block: 4,
    type: "textarea",
    question: "Você já imaginou alguma profissão, área, serviço, produto ou negócio? Qual?",
    helper: "Não precisa ter certeza. Essa resposta será considerada como uma hipótese, não como destino obrigatório.",
    optional: true,
    maxChars: 500,
    path: ["blocoD", "hipoteseImaginada"],
  },
];

// ===== Bloco E — condicional pela rota profissional =====
export const ROUTE_STEPS: Record<RotaProfissional, WizardStep[]> = {
  CARREIRA: [
    {
      slug: "carreira-ambientes",
      block: 5,
      type: "multi-select",
      question: "Em quais ambientes você se imagina trabalhando?",
      options: [
        { value: "empresa_privada", label: "Empresa privada" },
        { value: "setor_publico", label: "Setor público" },
        { value: "organizacao_social", label: "Organização social" },
        { value: "consultoria", label: "Consultoria" },
        { value: "startup_tech", label: "Startup ou empresa de tecnologia" },
        { value: "industria_tecnica", label: "Indústria ou operação técnica" },
        { value: "negocio_familiar", label: "Negócio pequeno ou familiar" },
        { value: "ainda_nao_sei", label: "Ainda não sei" },
        { value: "outro", label: "Outro" },
      ],
      maxSelect: 3,
      allowOther: true,
      path: ["blocoRota", "carreiraAmbientes"],
    },
    {
      slug: "carreira-tipo-destino",
      block: 5,
      type: "single-select",
      question: "Que tipo de destino profissional parece mais útil para você agora?",
      options: [
        { value: "cargo_conhecido", label: "Um cargo conhecido, com requisitos e processos seletivos mais claros." },
        { value: "funcao_emergente", label: "Uma função emergente, mesmo que o caminho de entrada seja menos padronizado." },
        { value: "aceito_ambos", label: "Aceito as duas possibilidades." },
      ],
      path: ["blocoRota", "carreiraTipoDestino"],
    },
    {
      slug: "carreira-ponto-entrada",
      block: 5,
      type: "single-select",
      question: "Como você se sente em relação ao ponto de entrada em uma nova carreira?",
      options: [
        { value: "aproveitar_experiencia", label: "Quero aproveitar minhas capacidades e experiência desde o início." },
        { value: "aceito_recomecar", label: "Aceito recomeçar em uma posição de entrada." },
        { value: "aceito_ambos_com_crescimento", label: "Aceito as duas, desde que exista perspectiva de crescimento." },
        { value: "ainda_nao_sei", label: "Ainda não sei." },
      ],
      path: ["blocoRota", "carreiraPontoEntrada"],
    },
  ],
  CRIACAO_VALOR: [
    {
      slug: "criacao-familias-preferidas",
      block: 5,
      type: "multi-select",
      question: "Que formas de criar valor mais despertam seu interesse?",
      helper: "Escolha até três. Você não precisa saber como fazer isso ainda.",
      options: [
        { value: "servico_especializado", label: "Serviço especializado" },
        { value: "implementacao_operacao", label: "Implementação ou operação" },
        { value: "produto_ativo", label: "Produto ou ativo replicável" },
        { value: "software_ferramenta", label: "Software ou ferramenta digital" },
        { value: "conteudo", label: "Conteúdo" },
        { value: "intermediacao_plataforma", label: "Intermediação ou plataforma" },
        { value: "ainda_nao_sei", label: "Ainda não sei" },
      ],
      maxSelect: 3,
      path: ["blocoRota", "criacaoFamiliasPreferidas"],
    },
    {
      slug: "criacao-modelos-receita",
      block: 5,
      type: "multi-select",
      question: "Que formas de ganhar dinheiro você aceitaria considerar?",
      options: [
        { value: "por_hora", label: "Por hora" },
        { value: "por_projeto", label: "Por projeto" },
        { value: "contrato_mensalidade", label: "Contrato ou mensalidade recorrente" },
        { value: "venda_produto", label: "Venda de produto" },
        { value: "assinatura", label: "Assinatura" },
        { value: "comissao_intermediacao", label: "Comissão ou intermediação" },
        { value: "remuneracao_propria_empresa", label: "Remuneração dentro de uma empresa que já possuo ou pretendo criar" },
        { value: "ainda_nao_sei", label: "Ainda não sei" },
      ],
      maxSelect: 3,
      path: ["blocoRota", "criacaoModelosReceita"],
    },
    {
      slug: "criacao-forma-construcao",
      block: 5,
      type: "single-select",
      question: "Como você imagina construir essa nova atuação?",
      options: [
        { value: "sozinho_pequeno", label: "Começar sozinho e manter uma estrutura pequena" },
        { value: "sozinho_crescer", label: "Começar sozinho e estruturar para crescer" },
        { value: "com_parceiros", label: "Construir com parceiros" },
        { value: "dentro_empresa_existente", label: "Desenvolver dentro de uma empresa ou negócio que já existe" },
        { value: "ainda_nao_sei", label: "Ainda não sei" },
      ],
      path: ["blocoRota", "criacaoFormaConstrucao"],
    },
  ],
  EXPLORACAO: [
    {
      slug: "exploracao-equilibrio",
      block: 5,
      type: "single-select",
      question: "Como você gostaria que as cinco possibilidades fossem distribuídas?",
      options: [
        { value: "equilibrio", label: "Equilíbrio entre carreiras e formas de atuação" },
        { value: "mais_carreira", label: "Mais possibilidades de carreira, mas sem excluir criação própria" },
        { value: "mais_criacao", label: "Mais possibilidades de criação própria, mas sem excluir carreiras" },
        { value: "evidencias_decidem", label: "Prefiro que as evidências decidam" },
      ],
      path: ["blocoRota", "exploracaoEquilibrio"],
    },
    {
      slug: "exploracao-primeiro-teste",
      block: 5,
      type: "single-select",
      question: "Se tivesse de experimentar uma direção por 30 dias, o que pareceria menos distante?",
      options: [
        { value: "testar_funcao_organizacao", label: "Conhecer e testar uma função profissional em uma organização" },
        { value: "construir_oferta", label: "Construir uma pequena oferta, produto ou solução" },
        { value: "experimentar_ambas", label: "Experimentar as duas coisas" },
        { value: "nao_consigo_escolher", label: "Ainda não consigo escolher" },
      ],
      path: ["blocoRota", "exploracaoPrimeiroTeste"],
    },
  ],
};

export function getStepsForRoute(rota: RotaProfissional | null | undefined): WizardStep[] {
  return rota ? [...SHARED_STEPS, ...ROUTE_STEPS[rota]] : SHARED_STEPS;
}

export function getStepBySlug(slug: string, rota: RotaProfissional | null | undefined) {
  return getStepsForRoute(rota).find((s) => s.slug === slug);
}

export function getStepIndex(slug: string, rota: RotaProfissional | null | undefined) {
  return getStepsForRoute(rota).findIndex((s) => s.slug === slug);
}

export function getNextSlug(slug: string, rota: RotaProfissional | null | undefined): string | null {
  const steps = getStepsForRoute(rota);
  const idx = steps.findIndex((s) => s.slug === slug);
  if (idx === -1 || idx === steps.length - 1) return null;
  return steps[idx + 1].slug;
}

export function getPrevSlug(slug: string, rota: RotaProfissional | null | undefined): string | null {
  const steps = getStepsForRoute(rota);
  const idx = steps.findIndex((s) => s.slug === slug);
  if (idx <= 0) return null;
  return steps[idx - 1].slug;
}

export function getTotalSteps(rota: RotaProfissional | null | undefined): number {
  return getStepsForRoute(rota).length;
}

// Acha a primeira etapa ainda não respondida, para retomar de onde parou.
// A intenção (Bloco A) nasce com um valor padrão ("NAO_SEI"), então só a
// consideramos "não respondida" se nada depois dela também foi preenchido.
export function getResumeSlug(
  intention: string,
  rota: RotaProfissional | null | undefined,
  answers: Record<string, unknown> | null | undefined,
): string {
  const steps = getStepsForRoute(rota);
  for (const step of steps) {
    if (step.type === "intention") {
      const nextStep = steps[1];
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
  return deepGet(obj, path);
}
