// Descrição das áreas do produto que ficam trancadas na conta gratuita —
// usada pela página /area-bloqueada e pelo menu (cadeado). A chave é o href
// do item de menu.
export const AREAS_TRANCADAS: Record<string, { titulo: string; descricao: string }> = {
  "/": {
    titulo: "Painel",
    descricao: "O seu painel do dia a dia: o plano ativo, a sua próxima ação, o quanto você já avançou e em que ponto da jornada você está.",
  },
  "/diagnostico/concluido": {
    titulo: "Meus negócios",
    descricao:
      "O questionário que identifica quais caminhos combinam melhor com o seu perfil, e os negócios personalizados pensados para o seu caso.",
  },
  "/planos": {
    titulo: "Planos de execução",
    descricao: "Até 5 planos de execução: as ações essenciais, na ordem certa e com checklist, para colocar em prática os negócios que você escolher.",
  },
  "/anti-procrastinacao": {
    titulo: "Antiprocrastinação",
    descricao: "Estratégias para manter o ritmo quando a execução trava.",
  },
};

export const ROTAS_TRANCADAS = Object.keys(AREAS_TRANCADAS);
