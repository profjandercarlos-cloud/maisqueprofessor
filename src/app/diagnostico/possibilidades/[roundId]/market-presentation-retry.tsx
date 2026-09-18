"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { retryMarketPresentation } from "./retry-actions";

const REFRESH_INTERVAL_MS = 8000;
const MAX_ATTEMPTS = 8; // ~64s de tentativas — camada aditiva, não vale insistir além disso

// Renderizado sem UI própria — dispara (e redispara, se preciso) a
// retomada da camada de apresentação de mercado enquanto alguma das 5
// possibilidades ainda não a tem, e atualiza a página pra ela aparecer sem
// precisar recarregar manualmente. É a ÚNICA fonte de disparo desta
// camada — o disparo de dentro da fila de geração foi removido de
// propósito (ver run-generation-pipeline.ts): quando a fase de validação
// já gastou tempo com correção + promoção de reserva, a Vercel interrompe
// o after() antes de chegar lá, sem lançar erro. Chamar de novo a cada
// tentativa (em vez de só uma vez) cobre o caso de a própria chamada de
// disparo falhar por um motivo passageiro — repetir é seguro (a fase em si
// já ignora chamadas redundantes quando a camada já foi gerada ou já está
// em andamento). Se nunca chegar, a tela continua funcionando normalmente
// sem essa camada (é aditiva).
export function MarketPresentationRetry({ roundId, needsRetry }: { roundId: string; needsRetry: boolean }) {
  const router = useRouter();
  const running = useRef(false);

  useEffect(() => {
    if (!needsRetry || running.current) return;
    running.current = true;

    let attempts = 0;
    const tick = () => {
      attempts++;
      retryMarketPresentation(roundId)
        .catch(() => {})
        .finally(() => router.refresh());
    };

    tick(); // primeira tentativa imediata, sem esperar o primeiro intervalo
    const interval = setInterval(() => {
      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(interval);
        return;
      }
      tick();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [needsRetry, roundId, router]);

  return null;
}
