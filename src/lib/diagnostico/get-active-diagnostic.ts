import { db } from "@/lib/db";

// Um usuário pode ter diagnósticos concluídos anteriores (ex.: incremento de
// diagnóstico, Etapa 4 do fluxo); esta função sempre pega/cria o mais recente
// em andamento, para continuar de onde parou.
export async function getOrCreateActiveDiagnostic(userId: string) {
  const existing = await db.diagnostic.findFirst({
    where: { userId, status: "EM_ANDAMENTO" },
    orderBy: { createdAt: "desc" },
  });

  if (existing) return existing;

  return db.diagnostic.create({
    data: {
      userId,
      intention: "NAO_SEI",
      answers: {},
    },
  });
}
