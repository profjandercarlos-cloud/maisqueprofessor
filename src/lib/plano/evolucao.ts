// 6 níveis (Iniciando + 5 degraus) — cobre o máximo de marcos que a IA gera
// por plano (MAX_MARCOS = 5, ver generate-report-plan-openai.ts), pra que
// marcar qualquer marco individual sempre mude o nível visível. Num plano
// com menos de 5 marcos, o teto alcançável é só mais baixo (nunca chega em
// Diamante) — não tem problema, seria estranho "completar" o plano inteiro
// e não ter todos os marcos possíveis.
export const LEVEL_ORDER = ["iniciando", "bronze", "prata", "ouro", "platina", "diamante"] as const;
export type Level = (typeof LEVEL_ORDER)[number];

export const LEVEL_LABELS: Record<Level, string> = {
  iniciando: "Iniciando",
  bronze: "Bronze",
  prata: "Prata",
  ouro: "Ouro",
  platina: "Platina",
  diamante: "Diamante",
};

export const LEVEL_COLORS: Record<Level, string> = {
  iniciando: "var(--ink-muted)",
  bronze: "#B08D57",
  prata: "#9AA5B1",
  ouro: "var(--gold)",
  platina: "#7FA8A0",
  diamante: "var(--role-4)",
};

export function computeLevel(achievedCount: number, totalCount: number): Level {
  if (totalCount === 0) return "iniciando";
  const index = Math.max(0, Math.min(achievedCount, LEVEL_ORDER.length - 1));
  return LEVEL_ORDER[index];
}

export function computeTaskCompletionPercent(tasks: { status: string }[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "COMPLETO").length;
  return Math.round((done / tasks.length) * 100);
}
