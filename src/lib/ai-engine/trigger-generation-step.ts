// Dispara a próxima fase da fila de geração (V4) como uma requisição HTTP
// de verdade pro próprio app, não uma chamada de função — cada fase precisa
// da sua própria invocação serverless, com seu próprio orçamento de tempo
// (ver src/app/api/internal/generation-step/route.ts). Chamado via after()
// tanto pelos 3 pontos que criam um GenerationRound quanto pelo fim de cada
// fase do pipeline (run-generation-pipeline.ts) e pela Server Action de
// retomada (retry-generation-step.ts).
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function triggerGenerationStep(roundId: string): Promise<void> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    console.error("INTERNAL_API_SECRET não configurado — não é possível disparar a fila de geração.");
    return;
  }
  try {
    await fetch(`${APP_URL}/api/internal/generation-step`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ roundId }),
    });
  } catch (err) {
    // Falha aqui não derruba nada — só significa que essa fase não foi
    // disparada agora. A retomada por rodada travada (polling-wait.tsx +
    // retryGenerationStep) cobre esse caso.
    console.error("Falha ao disparar a próxima fase da geração", err);
  }
}
