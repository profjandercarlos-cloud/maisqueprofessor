// Fórmula de dimensionamento do plano — Análise "Execução Dinâmica do Plano"
// (decisão final). Duração é sempre fixa; o que varia por pessoa é o volume
// de trabalho que cabe nela, não o prazo — isso é o que dá credibilidade
// (compromisso de "3 meses pra mudar de vida") e ainda respeita o tempo real
// de cada um.

export const PLAN_DURATION_SEMANAS = 12;
export const PLAN_MAX_HORAS = 120; // teto: 12 semanas × 10h/semana

// Horas totais que a IA deve mirar ao gerar o plano — sempre 12 semanas ×
// horas/semana declaradas, travado no teto. Quem tem mais tempo que o teto
// não ganha um plano maior: adianta tarefas dentro das mesmas 12 semanas.
export function calcularHorasTotais(horasPorSemana: number): number {
  return Math.min(PLAN_DURATION_SEMANAS * Math.max(horasPorSemana, 0.5), PLAN_MAX_HORAS);
}
