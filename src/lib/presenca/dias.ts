// Dias da lista de presença. A virada do dia é à meia-noite de Brasília (o servidor roda em
// UTC), então todo "dia" aqui é uma string AAAA-MM-DD já no fuso certo.
const FUSO = "America/Sao_Paulo";
const MS_DIA = 24 * 60 * 60 * 1000;

export function diaLocal(data: Date): string {
  // en-CA formata como AAAA-MM-DD
  return data.toLocaleDateString("en-CA", { timeZone: FUSO });
}

// A coluna `dia` do banco é DATE: o Prisma a entrega como Date em UTC à meia-noite.
export function diaParaData(dia: string): Date {
  return new Date(`${dia}T00:00:00.000Z`);
}

export function dataParaDia(data: Date): string {
  return data.toISOString().slice(0, 10);
}

// Quantos dias de calendário separam a de b (b depois de a = positivo).
export function diasEntre(a: string, b: string): number {
  return Math.round((diaParaData(b).getTime() - diaParaData(a).getTime()) / MS_DIA);
}

export function somarDias(dia: string, n: number): string {
  return dataParaDia(new Date(diaParaData(dia).getTime() + n * MS_DIA));
}

export type SituacaoDePresenca = {
  /** Dias de presença, contando hoje. Nunca diminui. */
  total: number;
  /** Dias seguidos terminando hoje (hoje conta). */
  seguidos: number;
  /** Dias sem presença entre a última vez e hoje (0 = veio ontem). null = primeira presença. */
  diasAusente: number | null;
};

// `anteriores` são os dias de presença ANTES de hoje, em qualquer ordem. Hoje é o dia em que
// a pessoa acabou de responder "Presente".
export function situacaoDePresenca(anteriores: string[], hoje: string): SituacaoDePresenca {
  const dias = [...new Set(anteriores.filter((d) => d < hoje))].sort();
  const total = dias.length + 1;
  if (dias.length === 0) return { total, seguidos: 1, diasAusente: null };

  const ultimo = dias[dias.length - 1];
  const diasAusente = diasEntre(ultimo, hoje) - 1;

  let seguidos = 1;
  let esperado = somarDias(hoje, -1);
  for (let i = dias.length - 1; i >= 0 && dias[i] === esperado; i--) {
    seguidos++;
    esperado = somarDias(esperado, -1);
  }
  return { total, seguidos, diasAusente };
}
