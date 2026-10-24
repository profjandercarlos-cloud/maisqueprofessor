// Descrição das áreas do produto que ficam trancadas na conta gratuita —
// usada pela página /area-bloqueada e pelo menu (cadeado). A chave é o href
// do item de menu.
export const AREAS_TRANCADAS: Record<string, { titulo: string; descricao: string }> = {
  "/": {
    titulo: "Painel",
    descricao: "O seu painel do dia a dia: o plano ativo, as tarefas da semana e o check-in.",
  },
  "/mapa": {
    titulo: "Mapa da jornada",
    descricao: "Onde você está no caminho, da escolha da possibilidade até a execução do plano.",
  },
  "/diagnostico/concluido": {
    titulo: "Meus negócios",
    descricao:
      "O questionário que identifica quais caminhos combinam melhor com o seu perfil, e os negócios personalizados pensados para o seu caso.",
  },
  "/planos": {
    titulo: "Planos de execução",
    descricao: "Até 5 planos personalizados, semana a semana, para colocar em prática os negócios que você escolher.",
  },
  "/agenda": {
    titulo: "Agenda",
    descricao: "Seus compromissos e o tempo reservado para executar o plano.",
  },
  "/evolucao": {
    titulo: "Evolução",
    descricao: "O acompanhamento do que você já fez e dos marcos que alcançou.",
  },
  "/anti-procrastinacao": {
    titulo: "Antiprocrastinação",
    descricao: "Estratégias para manter o ritmo quando a execução trava.",
  },
};

export const ROTAS_TRANCADAS = Object.keys(AREAS_TRANCADAS);
