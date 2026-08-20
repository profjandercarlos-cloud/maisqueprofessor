const TIME_ZONE = "America/Sao_Paulo";

// O servidor (Vercel) roda em UTC — sem fixar o fuso aqui, uma data perto da
// meia-noite pode aparecer com o dia errado para quem está no Brasil.
export function formatDate(date: Date, opts?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString("pt-BR", { timeZone: TIME_ZONE, ...opts });
}

export function formatDateTime(date: Date, opts?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleString("pt-BR", { timeZone: TIME_ZONE, ...opts });
}
