import { timingSafeEqual } from "node:crypto";

// Compara dois segredos (tokens de webhook/cron) sem vazar quanto do valor
// já bateu através do tempo de resposta. timingSafeEqual exige buffers do
// mesmo tamanho — comprimentos diferentes já são tratados como "não bate"
// antes de chamar a função nativa (essa checagem de tamanho em si não
// precisa ser em tempo constante, só o conteúdo).
export function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
