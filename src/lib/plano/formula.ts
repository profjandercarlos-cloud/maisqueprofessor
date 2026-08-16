// Fórmula Tempo × Profundidade — Proposta_Tempo_Profundidade.md (aprovada).
// duração (semanas) = orçamento de horas ÷ horas disponíveis por semana,
// arredondado e limitado ao piso/teto da profundidade escolhida.

export type Profundidade = "EXPLORACAO" | "TESTE_REAL" | "MERGULHO";

type ProfundidadeConfig = {
  orcamentoHoras: number;
  minSemanas: number;
  maxSemanas: number;
  minTarefas: number;
  maxTarefas: number;
  label: string;
  descricao: string;
};

export const PROFUNDIDADE_CONFIG: Record<Profundidade, ProfundidadeConfig> = {
  EXPLORACAO: {
    orcamentoHoras: 8,
    minSemanas: 2,
    maxSemanas: 4,
    minTarefas: 1,
    maxTarefas: 2,
    label: "Exploração",
    descricao: "Só quero entender se faz sentido",
  },
  TESTE_REAL: {
    orcamentoHoras: 30,
    minSemanas: 4,
    maxSemanas: 8,
    minTarefas: 2,
    maxTarefas: 3,
    label: "Teste real",
    descricao: "Quero um primeiro teste pequeno, mas de verdade",
  },
  MERGULHO: {
    orcamentoHoras: 70,
    minSemanas: 6,
    maxSemanas: 12,
    minTarefas: 3,
    maxTarefas: 4,
    label: "Mergulho",
    descricao: "Quero ir com tudo desde já",
  },
};

export function calcularDuracaoSemanas(profundidade: Profundidade, horasPorSemana: number): number {
  const config = PROFUNDIDADE_CONFIG[profundidade];
  const bruto = Math.round(config.orcamentoHoras / Math.max(horasPorSemana, 0.5));
  return Math.min(Math.max(bruto, config.minSemanas), config.maxSemanas);
}
