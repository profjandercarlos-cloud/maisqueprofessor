// Distribui as semanas geradas entre as Ações padronizadas do plano. A IA
// já é instruída a fazer a soma de numero_semanas bater exatamente com o
// total de semanas (ver report-plan-prompt.ts), mas normalizeWeekCount
// (generate-report-plan-openai.ts) pode alterar o número final de semanas
// depois da geração — essa função é a rede de segurança determinística que
// garante que toda semana final fica coberta por alguma Ação, sem inventar
// conteúdo novo, seguindo o mesmo padrão das outras normalizações do motor.
export function distribuirSemanasPorAcao(
  acoes: { numero_semanas: number }[],
  totalSemanas: number,
): { inicio: number; fim: number }[] {
  const resultado: { inicio: number; fim: number }[] = [];
  let cursor = 0;

  for (let i = 0; i < acoes.length; i++) {
    const restante = totalSemanas - cursor;
    if (restante <= 0) {
      resultado.push({ inicio: cursor, fim: cursor });
      continue;
    }

    const ehUltima = i === acoes.length - 1;
    const restantesAcoes = acoes.length - i;
    let tamanho = ehUltima ? restante : acoes[i].numero_semanas;
    // Nunca menos que 1 semana (quando ainda sobra semana pra dar) nem mais
    // do que deixaria as ações seguintes sem nenhuma semana.
    tamanho = Math.max(1, Math.min(tamanho, restante - (restantesAcoes - 1)));

    resultado.push({ inicio: cursor, fim: cursor + tamanho });
    cursor += tamanho;
  }

  return resultado;
}
