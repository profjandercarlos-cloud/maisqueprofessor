// Dispara a camada de apresentação de mercado (ADITIVA, ver
// market-presentation-prompt.ts) como uma requisição HTTP separada — mesmo
// padrão de trigger-generation-step.ts, com orçamento de tempo próprio, pra
// não competir com a fase de validação que acabou de concluir o round. Se
// esta chamada nunca rodar (segredo ausente, erro de rede), as 5
// possibilidades continuam funcionando normalmente sem a camada — é
// puramente aditiva e reversível.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function triggerMarketPresentationStep(roundId: string): Promise<void> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    console.error("INTERNAL_API_SECRET não configurado — não é possível disparar a apresentação de mercado.");
    return;
  }
  try {
    await fetch(`${APP_URL}/api/internal/market-presentation`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ roundId }),
    });
  } catch (err) {
    // Camada aditiva — falha aqui nunca deve impedir o round de estar
    // pronto. Sem retomada automática de propósito: se falhar, as 5
    // possibilidades simplesmente não ganham a camada extra desta vez.
    console.error("Falha ao disparar a camada de apresentação de mercado", err);
  }
}
