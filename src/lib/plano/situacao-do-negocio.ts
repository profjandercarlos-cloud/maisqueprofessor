// Em que ponto está um negócio (gerado pelo diagnóstico ou vindo de um favorito):
// serve de selo de texto em "Meus negócios" e de contagem na jornada do Painel.
// Sai só do estado real do negócio e das ações do plano, nunca é digitado.
import type { StatusAcao } from "./acoes";

export type SituacaoDoNegocio = "disponivel" | "nao_seguido" | "escolhido" | "plano_criado" | "em_execucao" | "concluido";

export const SITUACAO_META: Record<SituacaoDoNegocio, { rotulo: string; cor: string; corFundo: string } | null> = {
  disponivel: null, // sem selo: é o estado normal de quem ainda não escolheu
  nao_seguido: { rotulo: "Não seguido", cor: "#7b8794", corFundo: "rgba(123,135,148,0.16)" },
  escolhido: { rotulo: "Escolhido", cor: "#7b8794", corFundo: "rgba(123,135,148,0.16)" },
  plano_criado: { rotulo: "Plano criado", cor: "#7b8794", corFundo: "rgba(123,135,148,0.16)" },
  em_execucao: { rotulo: "Em execução", cor: "#d9930d", corFundo: "rgba(217,147,13,0.18)" },
  concluido: { rotulo: "Concluído", cor: "#2f9e6e", corFundo: "rgba(47,158,110,0.18)" },
};

export function situacaoDoNegocio(p: {
  status: "PENDENTE" | "APROVADA" | "REJEITADA";
  plan: { acoes: { status: StatusAcao }[] } | null;
}): SituacaoDoNegocio {
  if (p.status === "REJEITADA") return "nao_seguido";
  if (p.plan) {
    const acoes = p.plan.acoes;
    if (acoes.length > 0 && acoes.every((a) => a.status === "CONCLUIDA")) return "concluido";
    return acoes.some((a) => a.status !== "A_FAZER") ? "em_execucao" : "plano_criado";
  }
  return p.status === "APROVADA" ? "escolhido" : "disponivel";
}
