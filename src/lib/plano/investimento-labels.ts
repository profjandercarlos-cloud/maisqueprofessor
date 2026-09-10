import type { OrcamentoFaixa } from "@/generated/prisma/client";

// Rótulos de exibição da faixa de orçamento do plano — usados tanto na tela
// do plano quanto no PDF exportado.
export const INVESTIMENTO_LABELS: Record<OrcamentoFaixa, string> = {
  SEM_INVESTIMENTO: "sem investimento",
  ATE_300: "até R$300",
  DE_300_A_1000: "entre R$300 e R$1.000",
  ACIMA_DE_1000: "acima de R$1.000",
};
