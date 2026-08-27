// Fórmula de dimensionamento do Plano Personalizado de Transição. Duração
// deixou de ser fixa (12 semanas para todo mundo) — nasce do esforço
// necessário para o nível de execução escolhido pela IA, dividido pela
// capacidade semanal sustentável da pessoa, sempre dentro da janela de 4 a
// 12 semanas (ver especificação "Plano Personalizado de Transição").

export const DURACAO_MIN_SEMANAS = 4;
export const DURACAO_MAX_SEMANAS = 12;
export const HORAS_NUCLEO_TETO_SEMANAL = 10;

export type NivelExecucaoIA = "validacao" | "implementacao" | "desenvolvimento";

export type EsforcoPorNivel = {
  esforcoMinimoHoras: number;
  esforcoRecomendadoHoras: number;
  esforcoAvancadoHoras: number;
};

// Teto real de tarefas obrigatórias por semana. Quem declara mais que o
// teto não ganha mais tarefas obrigatórias — o excedente vira atividade
// opcional (ver PlanTask.opcional), claramente separada do núcleo.
export function calcularHorasNucleoSemana(horasPorSemana: number): number {
  return Math.min(Math.max(horasPorSemana, 0.5), HORAS_NUCLEO_TETO_SEMANAL);
}

// Esforço total (horas) associado ao nível de execução que a IA escolheu
// pra essa pessoa, a partir do Mapa de Execução da possibilidade.
export function esforcoParaNivel(nivel: NivelExecucaoIA, esforco: EsforcoPorNivel): number {
  if (nivel === "validacao") return esforco.esforcoMinimoHoras;
  if (nivel === "implementacao") return esforco.esforcoRecomendadoHoras;
  return esforco.esforcoAvancadoHoras;
}

// Duração-alvo em semanas = esforço necessário ÷ capacidade sustentável,
// sempre clampada em [4, 12]. Quando o esforço for grande demais pra caber
// em 12 semanas, o escopo é o que cede (ver REPORT_PLAN_SYSTEM_PROMPT) —
// nunca a duração ultrapassa o teto.
export function calcularDuracaoSemanas(esforcoHoras: number, horasNucleoSemana: number): number {
  const bruta = Math.round(esforcoHoras / horasNucleoSemana);
  return Math.min(Math.max(bruta, DURACAO_MIN_SEMANAS), DURACAO_MAX_SEMANAS);
}

// Teto de marcos proporcional à duração final do plano — planos curtos não
// precisam forçar a mesma quantidade de marcos de um plano de 12 semanas.
export function marcosMaxParaDuracao(duracaoSemanas: number): number {
  if (duracaoSemanas <= 5) return 3;
  if (duracaoSemanas <= 10) return 4;
  return 5;
}
