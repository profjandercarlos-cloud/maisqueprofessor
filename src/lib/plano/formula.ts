// Fórmula de dimensionamento do plano — Análise "Execução Dinâmica do Plano"
// (decisão final). Duração é sempre fixa; o que varia por pessoa é o volume
// de trabalho que cabe nela, não o prazo — isso é o que dá credibilidade
// (compromisso de "3 meses pra mudar de vida") e ainda respeita o tempo real
// de cada um.

export const PLAN_DURATION_SEMANAS = 12;
export const PLAN_MAX_HORAS = 120; // teto: 12 semanas × 10h/semana
export const HORAS_NUCLEO_TETO_SEMANAL = 10;

// Teto real de tarefas obrigatórias por semana. Quem declara mais que o
// teto não ganha mais tarefas obrigatórias — o excedente vira atividade
// opcional (ver PlanTask.opcional), claramente separada do núcleo.
export function calcularHorasNucleoSemana(horasPorSemana: number): number {
  return Math.min(Math.max(horasPorSemana, 0.5), HORAS_NUCLEO_TETO_SEMANAL);
}

// Horas totais que a IA deve mirar ao gerar o plano — sempre 12 semanas ×
// núcleo semanal, já travado no teto (12 × 10 = 120) por construção.
export function calcularHorasTotais(horasPorSemana: number): number {
  return PLAN_DURATION_SEMANAS * calcularHorasNucleoSemana(horasPorSemana);
}
