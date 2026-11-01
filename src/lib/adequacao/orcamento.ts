import type { OrcamentoFaixa } from "@/generated/prisma/client";

// A única pergunta antes de criar um plano: quanto a pessoa tem para investir. É a
// única condição que muda o conteúdo do plano (limita os gastos que ele pode sugerir).
// Os `value` batem com o enum Prisma OrcamentoFaixa.
export const PERGUNTA_ORCAMENTO = "Quanto você tem disponível para investir neste plano, se realmente for necessário?";
export const AJUDA_ORCAMENTO = "O plano não precisa gastar esse valor. Ele apenas não poderá ultrapassar o limite escolhido.";

export const OPCOES_ORCAMENTO: { value: OrcamentoFaixa; label: string }[] = [
  { value: "SEM_INVESTIMENTO", label: "Prefiro não investir nada por enquanto." },
  { value: "ATE_300", label: "Até R$300 no total." },
  { value: "DE_300_A_1000", label: "Entre R$300 e R$1.000 no total." },
  { value: "ACIMA_DE_1000", label: "Acima de R$1.000 no total." },
];

export function orcamentoValido(valor: unknown): valor is OrcamentoFaixa {
  return OPCOES_ORCAMENTO.some((o) => o.value === valor);
}
