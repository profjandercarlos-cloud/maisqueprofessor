"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { retryMarketPresentation } from "./retry-actions";

const REFRESH_INTERVAL_MS = 8000;
const MAX_ATTEMPTS = 4; // ~32s de tentativas — camada aditiva, não vale insistir além disso

// Renderizado sem UI própria — só dispara a retomada da camada de
// apresentação de mercado quando alguma das 5 possibilidades ainda não a
// tem, e atualiza a página algumas vezes pra ela aparecer sem precisar de
// recarregar manualmente. Se nunca chegar, a tela continua funcionando
// normalmente sem essa camada (é aditiva).
export function MarketPresentationRetry({ roundId, needsRetry }: { roundId: string; needsRetry: boolean }) {
  const router = useRouter();
  const attempted = useRef(false);

  useEffect(() => {
    if (!needsRetry || attempted.current) return;
    attempted.current = true;

    retryMarketPresentation(roundId).catch(() => {});

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      router.refresh();
      if (attempts >= MAX_ATTEMPTS) clearInterval(interval);
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [needsRetry, roundId, router]);

  return null;
}
