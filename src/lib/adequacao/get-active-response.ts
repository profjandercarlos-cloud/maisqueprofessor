import { db } from "@/lib/db";

// Mesma lógica de getOrCreateActiveDiagnostic — cria ou retoma as respostas
// de adequação em andamento pra essa possibilidade específica.
export async function getOrCreateAdequacaoResponse(possibilityId: string) {
  const existing = await db.adequacaoResponse.findUnique({ where: { possibilityId } });
  if (existing) return existing;

  return db.adequacaoResponse.create({
    data: { possibilityId, answers: {} },
  });
}
