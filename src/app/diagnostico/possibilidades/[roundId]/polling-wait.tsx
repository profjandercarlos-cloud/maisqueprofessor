"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { retryGenerationStep } from "./retry-actions";

const POLL_INTERVAL_MS = 12000;
// Um conjunto que passa por correção pode encadear até 4-5 fases (geração,
// auditoria, uma ou mais correções em lote, nova auditoria) — medido um
// caso real levando ~8min no total, mesmo com cada fase individualmente
// saudável. 6 minutos aqui já mostrava "demorando demais" numa geração que
// terminava certinho pouco depois, sem nenhum problema real.
const GIVE_UP_AFTER_MS = 15 * 60 * 1000;
// Sem atualização por mais que isso → tenta redisparar a fase. Fica bem
// acima do pior tempo de uma fase saudável já medido (~96s pra geração)
// pra não competir em corrida com uma fase lenta, porém viva — o pipeline
// já é seguro contra disparo duplicado (controle de concorrência otimista
// em run-generation-pipeline.ts), mas evitar a corrida também evita
// chamadas de IA duplicadas e desperdiçadas.
const STALE_AFTER_MS = 180 * 1000;

const STATUS_TEXT: Record<string, string> = {
  PENDENTE: "Gerando suas possibilidades…",
  GERANDO: "Gerando as cinco possibilidades…",
  VALIDANDO: "Revisando a seleção…",
  CORRIGINDO: "Ajustando as possibilidades marcadas…",
  PROCESSANDO: "Gerando suas possibilidades…",
};

export function PollingWait({
  roundId,
  status,
  updatedAtIso,
}: {
  roundId: string;
  status: string;
  updatedAtIso: string;
}) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);
  // Date.now() não pode rodar direto no corpo do componente (regra de
  // pureza do React — render pode ser especulativamente repetido); marca o
  // início dentro do próprio efeito que usa o valor, não no render.
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (timedOut) return;
    if (startedAt.current === null) startedAt.current = Date.now();

    const interval = setInterval(() => {
      if (Date.now() - (startedAt.current ?? Date.now()) > GIVE_UP_AFTER_MS) {
        setTimedOut(true);
        return;
      }
      const staleFor = Date.now() - new Date(updatedAtIso).getTime();
      if (staleFor > STALE_AFTER_MS) {
        retryGenerationStep(roundId).finally(() => router.refresh());
      } else {
        router.refresh();
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [router, timedOut, roundId, updatedAtIso]);

  if (timedOut) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[var(--radius-app)] border border-line bg-paper-raised px-6 py-12 text-center">
        <p className="text-[14px] font-semibold text-ink">Isso está demorando mais que o esperado.</p>
        <p className="max-w-[40ch] text-[13px] text-ink-muted">
          Sua geração ainda pode estar em andamento. Recarregue a página em alguns instantes.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-petrol px-5 py-2 text-[13px] font-semibold text-white hover:opacity-90"
        >
          Recarregar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-[var(--radius-app)] border border-line bg-paper-raised px-6 py-16 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-petrol" />
      <p className="text-[14px] font-semibold text-ink">{STATUS_TEXT[status] ?? "Gerando suas possibilidades…"}</p>
      <p className="max-w-[38ch] text-[13px] text-ink-muted">
        Isso pode levar alguns minutos. Estamos construindo e revisando cada possibilidade com
        cuidado antes de mostrar a você.
      </p>
    </div>
  );
}
