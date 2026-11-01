// Calendário do mês da lista de presença: só marca os dias em que a pessoa disse "Presente".
// Dia sem presença fica em branco, sem sinal de falta. Semana começa no domingo.
import { somarDias } from "./dias";

export type CelulaDoMes = { dia: string; numero: number; presente: boolean; hoje: boolean; futuro: boolean };

export const NOMES_DOS_MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export const DIAS_DA_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

const MES_VALIDO = /^(\d{4})-(0[1-9]|1[0-2])$/;

// "2026-11" -> {ano, mes(1-12)}; qualquer outra coisa cai no mês de `hoje`.
export function lerMes(valor: string | undefined, hoje: string): { ano: number; mes: number } {
  const m = valor ? MES_VALIDO.exec(valor) : null;
  const base = m ?? MES_VALIDO.exec(hoje.slice(0, 7))!;
  return { ano: Number(base[1]), mes: Number(base[2]) };
}

export function mesVizinho(ano: number, mes: number, delta: number): { ano: number; mes: number } {
  const indice = ano * 12 + (mes - 1) + delta;
  return { ano: Math.floor(indice / 12), mes: (indice % 12) + 1 };
}

export function chaveDoMes(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

// Semanas do mês (linhas de 7); `null` preenche os dias de fora do mês.
export function montarMes(
  ano: number,
  mes: number,
  presentes: Set<string>,
  hoje: string,
): (CelulaDoMes | null)[][] {
  const primeiro = `${chaveDoMes(ano, mes)}-01`;
  const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const deslocamento = new Date(`${primeiro}T00:00:00.000Z`).getUTCDay(); // 0 = domingo

  const celulas: (CelulaDoMes | null)[] = Array.from({ length: deslocamento }, () => null);
  for (let n = 1; n <= diasNoMes; n++) {
    const dia = somarDias(primeiro, n - 1);
    celulas.push({ dia, numero: n, presente: presentes.has(dia), hoje: dia === hoje, futuro: dia > hoje });
  }
  while (celulas.length % 7 !== 0) celulas.push(null);

  const semanas: (CelulaDoMes | null)[][] = [];
  for (let i = 0; i < celulas.length; i += 7) semanas.push(celulas.slice(i, i + 7));
  return semanas;
}
