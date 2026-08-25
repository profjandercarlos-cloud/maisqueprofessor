export type Level = "iniciando" | "prata" | "ouro" | "diamante";

export const LEVEL_LABELS: Record<Level, string> = {
  iniciando: "Iniciando",
  prata: "Prata",
  ouro: "Ouro",
  diamante: "Diamante",
};

export const LEVEL_COLORS: Record<Level, string> = {
  iniciando: "var(--ink-muted)",
  prata: "#9AA5B1",
  ouro: "var(--gold)",
  diamante: "var(--role-4)",
};

// Escala com qualquer contagem de marcos (3 a 5, ou até menos/mais em
// planos antigos): o primeiro marco alcançado já tira do "Iniciando", o
// último (todos alcançados) é "Diamante" — o que sobra no meio vira "Ouro".
export function computeLevel(achievedCount: number, totalCount: number): Level {
  if (totalCount === 0 || achievedCount === 0) return "iniciando";
  if (achievedCount >= totalCount) return "diamante";
  if (achievedCount === 1) return "prata";
  return "ouro";
}

export function computeTaskCompletionPercent(tasks: { status: string }[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "COMPLETO").length;
  return Math.round((done / tasks.length) * 100);
}
