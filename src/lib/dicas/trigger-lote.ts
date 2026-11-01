// Dispara a geração de um lote novo de dicas como uma requisição HTTP para o próprio app, para ela
// ter o seu próprio orçamento de tempo (mesmo padrão da fila de geração, ver
// src/lib/ai-engine/trigger-generation-step.ts). Chamado via after() depois de marcar presença.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function triggerLoteDeDicas(): Promise<void> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    console.error("INTERNAL_API_SECRET não configurado: não é possível gerar um novo lote de dicas.");
    return;
  }
  try {
    await fetch(`${APP_URL}/api/internal/dicas-lote`, {
      method: "POST",
      headers: { authorization: `Bearer ${secret}` },
    });
  } catch (err) {
    // Sem consequência para a pessoa: a próxima presença que encontrar o banco acabando tenta de novo.
    console.error("Falha ao disparar a geração de dicas", err);
  }
}
