// Marcos do plano = as 5 medalhas (Bronze a Diamante, ver evolucao.ts). A IA escolhe, ao
// gerar o plano, qual ação fecha cada marco; assim sempre há 5 degraus, não importa se o
// plano tem 5 ou 10 ações. A medalha é conquistada quando a ação do marco é concluída.
import type { StatusAcao } from "./acoes";

export const TOTAL_MARCOS = 5;

// Plano sem marcos (anterior a esta regra): uma medalha a cada quinto das ações concluídas.
export function medalhasDoPlano(concluidas: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(TOTAL_MARCOS, Math.floor((concluidas / total) * TOTAL_MARCOS));
}

export type MarcoGerado = { acao: number; nome: string };

// Rótulos de reserva, usados só quando a IA devolve marcos inválidos. Seguem a jornada
// de qualquer negócio: preparar, ir ao mercado, fechar, entregar, avaliar.
const NOMES_RESERVA = [
  "Base preparada",
  "Primeiro contato com o mercado",
  "Primeiro compromisso firmado",
  "Primeiro serviço entregue",
  "Avaliação concluída",
];

// Os marcos valem se forem 5, cada um numa ação existente, em ordem estritamente
// crescente, com o último na última ação (a avaliação).
export function marcosValidos(marcos: MarcoGerado[], totalAcoes: number): boolean {
  if (marcos.length !== TOTAL_MARCOS) return false;
  if (!marcos.every((m) => Number.isInteger(m.acao) && m.acao >= 1 && m.acao <= totalAcoes && m.nome.trim().length > 0)) {
    return false;
  }
  if (marcos[TOTAL_MARCOS - 1].acao !== totalAcoes) return false;
  return marcos.every((m, i) => i === 0 || m.acao > marcos[i - 1].acao);
}

// Se a IA errou, em vez de falhar a geração do plano distribuímos os 5 marcos de forma
// uniforme (uma ação a cada quinto do plano) com os nomes de reserva. O plano exige 5 a 10
// ações, então sempre há ação suficiente para 5 marcos distintos.
export function normalizarMarcos(marcos: MarcoGerado[], totalAcoes: number): MarcoGerado[] {
  if (marcosValidos(marcos, totalAcoes)) return marcos.map((m) => ({ acao: m.acao, nome: m.nome.trim() }));
  return NOMES_RESERVA.map((nome, i) => ({ acao: Math.ceil(((i + 1) * totalAcoes) / TOTAL_MARCOS), nome }));
}

export type AcaoComMarco = { sequencia: number; status: StatusAcao; marco: string | null };

// Quantas medalhas a pessoa já tem. Plano com marcos: conta os marcos cuja ação foi
// concluída. Plano sem marcos (criado antes disto): uma medalha a cada quinto concluído.
export function medalhasConquistadas(acoes: AcaoComMarco[]): number {
  const comMarco = acoes.filter((a) => a.marco);
  if (comMarco.length > 0) return comMarco.filter((a) => a.status === "CONCLUIDA").length;
  return medalhasDoPlano(acoes.filter((a) => a.status === "CONCLUIDA").length, acoes.length);
}
