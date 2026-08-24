// Segue a mesma convenção de data math do resto do app (ver PlanWeek):
// as datas trafegam como "dia calendário" puro, sem considerar fuso na
// aritmética — só na exibição (formatDate já cuida disso).

export const WEEKS_PER_EXTENSION = 52;
export const GRID_START_MINUTES = 6 * 60; // 06:00
export const GRID_END_MINUTES = 24 * 60; // 24:00
export const SLOT_MINUTES = 30;
export const HIGHLIGHT_START_MINUTES = 7 * 60; // 07:00
export const HIGHLIGHT_END_MINUTES = 19 * 60; // 19:00

// Ordem de exibição da grade: segunda a domingo. O valor de `weekday`
// continua 0 (domingo) a 6 (sábado), igual WEEKDAY_LABELS.
export const WEEK_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const WEEKDAY_SHORT_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function getMondayOfWeek(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0=domingo..6=sábado
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d;
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function minutesToTimeInputValue(minutes: number): string {
  return formatMinutes(minutes);
}

export function timeInputValueToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 24 || m < 0 || m > 59) return null;
  const total = h * 60 + m;
  return total >= 0 && total <= GRID_END_MINUTES ? total : null;
}

export function gridRow(minutes: number): number {
  return Math.round((minutes - GRID_START_MINUTES) / SLOT_MINUTES) + 2; // +1 pro cabeçalho, +1 pra grid 1-based
}
