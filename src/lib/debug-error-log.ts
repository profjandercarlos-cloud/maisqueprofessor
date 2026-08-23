import { db } from "@/lib/db";

// TEMPORÁRIO — ver nota no schema (model DebugErrorLog). Grava o erro real
// no banco pra consulta direta, sem depender da retenção curta dos Runtime
// Logs da Vercel no plano Hobby. Nunca deixa uma falha aqui derrubar o
// fluxo principal — é só um registro auxiliar.
export async function logDebugError(context: string, err: unknown) {
  try {
    await db.debugErrorLog.create({
      data: {
        context,
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? (err.stack ?? null) : null,
      },
    });
  } catch (logErr) {
    console.error("Falha ao gravar debug_error_logs", logErr);
  }
}
