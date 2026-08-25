// Conteúdo fixo, curado à mão a partir de conceitos conhecidos de livros
// sobre formação de hábitos — não gerado por IA e não específico de
// nenhum plano. A pessoa é quem conecta cada item à sua própria execução,
// escrevendo a própria ação (ver AntiProcrastinacaoResposta).
export type AntiProcrastinacaoItem = {
  key: string;
  titulo: string;
  fonte: string;
  explicacao: string;
  prompt: string;
};

export const ANTI_PROCRASTINACAO_ITENS: AntiProcrastinacaoItem[] = [
  {
    key: "menor-passo",
    titulo: "Comece pelo menor passo possível",
    fonte: "Hábitos Atômicos, James Clear — regra dos 2 minutos",
    explicacao:
      "Qualquer hábito pode ser reduzido a uma versão de 2 minutos. Quando uma tarefa do plano parecer grande demais, não pergunte \"como eu termino isso\" — pergunte \"qual é a menor ação que já conta como começar\". O objetivo não é completar, é aparecer.",
    prompt: "Qual é a versão de 2 minutos da tarefa que você mais está adiando no seu plano agora?",
  },
  {
    key: "gatilho-visivel",
    titulo: "Deixe o gatilho visível",
    fonte: "Hábitos Atômicos, James Clear — torne óbvio",
    explicacao:
      "Hábitos que dependem só de \"lembrar\" costumam falhar. Um gatilho visual — um horário fixo na Agenda, um alarme, um lembrete à vista — tira a decisão do calor do momento e coloca no planejamento, quando você está mais racional.",
    prompt: "Que gatilho concreto vai te lembrar de trabalhar no plano — um horário fixo, um alarme, um bilhete?",
  },
  {
    key: "empilhar-habito",
    titulo: "Empilhe num hábito que já existe",
    fonte: "Hábitos Atômicos, James Clear — habit stacking",
    explicacao:
      "É mais fácil grudar um hábito novo em um que você já faz todo dia do que criar um do zero. A fórmula é simples: depois de [algo que já é automático], eu vou [ação do plano].",
    prompt: "Complete: depois de ___ (algo que você já faz todo dia), eu vou trabalhar no plano por ___ minutos.",
  },
  {
    key: "reduzir-atrito",
    titulo: "Reduza o atrito antes de começar",
    fonte: "Hábitos Atômicos, James Clear — torne fácil",
    explicacao:
      "Cada passo extra entre você e a tarefa — abrir um app, procurar um arquivo, decidir por onde começar — é uma chance a mais de desistir. Preparar o ambiente com antecedência custa pouco e evita a maior parte da resistência.",
    prompt: "O que você pode deixar pronto na véspera pra reduzir o esforço de começar amanhã?",
  },
  {
    key: "recompensa-imediata",
    titulo: "Dê a si mesmo uma recompensa imediata",
    fonte: "Hábitos Atômicos, James Clear — torne satisfatório",
    explicacao:
      "Recompensas distantes — o resultado final do plano, lá na semana 12 — não sustentam o hábito no dia a dia. Você precisa de algo que sinta bem agora, logo depois de agir, pro cérebro associar a ação a algo bom.",
    prompt: "Qual pequena recompensa você vai se dar assim que completar uma tarefa do plano?",
  },
  {
    key: "identidade",
    titulo: "Vista a identidade, não só a meta",
    fonte: "Hábitos Atômicos, James Clear",
    explicacao:
      "Metas dizem o que você quer alcançar; identidade diz quem você está decidindo ser. \"Estou tentando executar um plano\" pesa menos do que \"sou alguém que cumpre o que planeja\".",
    prompt: "Complete: eu sou o tipo de pessoa que ___.",
  },
  {
    key: "loop-procrastinacao",
    titulo: "Reconheça seu loop de procrastinação",
    fonte: "O Poder do Hábito, Charles Duhigg — gatilho, rotina, recompensa",
    explicacao:
      "Todo hábito, inclusive o de procrastinar, tem um gatilho, uma rotina e uma recompensa. Adiar a tarefa geralmente te dá um alívio imediato — essa é a recompensa que sustenta o loop. Pra quebrar, mantenha o gatilho e a recompensa, mas troque a rotina.",
    prompt: "Quando você procrastina no plano, o que costuma disparar isso — e o que você faz em vez de trabalhar nele?",
  },
  {
    key: "habito-chave",
    titulo: "Escolha seu hábito-chave",
    fonte: "O Poder do Hábito, Charles Duhigg — keystone habit",
    explicacao:
      "Alguns hábitos, quando estabelecidos, arrastam outros bons junto. Em vez de tentar mudar tudo de uma vez, escolha um hábito pequeno e consistente que, sozinho, já destrava o resto.",
    prompt: "Se você só conseguisse manter UM hábito relacionado ao plano essa semana, qual seria?",
  },
  {
    key: "sapo-primeiro",
    titulo: "Faça a tarefa mais difícil primeiro",
    fonte: "Coma Esse Sapo, Brian Tracy",
    explicacao:
      "A tarefa que você mais evita geralmente é a que mais importa. Adiá-la consome energia mental o dia inteiro, mesmo sem fazer nada nela. Fazer ela primeiro, ainda com a mente descansada, costuma custar bem menos do que parecia de longe.",
    prompt: "Qual é o \"sapo\" da sua semana no plano — a tarefa que você mais está evitando?",
  },
];
