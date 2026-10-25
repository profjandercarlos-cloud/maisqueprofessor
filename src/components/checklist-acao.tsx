"use client";

import { useOptimistic, useTransition } from "react";
import { alternarItem } from "@/app/planos/[planId]/acoes/[acaoId]/actions";
import { STATUS_ACAO_META, statusDaAcao } from "@/lib/plano/acoes";

type Item = { id: string; texto: string; feito: boolean };

// Checklist de uma ação. Cada clique marca/desmarca o item na hora (estado
// otimista) e grava em seguida; o estado da ação (a fazer, em andamento,
// concluída) é recalculado aqui e, de forma definitiva, no servidor.
export function ChecklistAcao({ planId, acaoId, itens }: { planId: string; acaoId: string; itens: Item[] }) {
  const [otimista, alternarOtimista] = useOptimistic(itens, (atual, id: string) =>
    atual.map((i) => (i.id === id ? { ...i, feito: !i.feito } : i)),
  );
  const [pendente, iniciar] = useTransition();

  function alternar(id: string) {
    iniciar(async () => {
      alternarOtimista(id);
      await alternarItem(planId, acaoId, id);
    });
  }

  const feitos = otimista.filter((i) => i.feito).length;
  const status = statusDaAcao(otimista);
  const meta = STATUS_ACAO_META[status];

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-[13.5px] font-semibold text-petrol">
          {feitos} de {otimista.length} {otimista.length === 1 ? "passo feito" : "passos feitos"}
        </p>
        <p className="font-mono text-[10.5px] font-semibold tracking-wide uppercase" style={{ color: meta.cor }}>
          {meta.rotulo}
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {otimista.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              role="checkbox"
              aria-checked={item.feito}
              onClick={() => alternar(item.id)}
              disabled={pendente}
              className={`flex w-full items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors disabled:opacity-80 ${
                item.feito ? "border-transparent" : "border-line bg-paper hover:border-petrol"
              }`}
              style={item.feito ? { background: STATUS_ACAO_META.CONCLUIDA.corFundo } : undefined}
            >
              <span
                className="mt-[2px] flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-md border-2"
                style={
                  item.feito
                    ? { background: STATUS_ACAO_META.CONCLUIDA.cor, borderColor: STATUS_ACAO_META.CONCLUIDA.cor }
                    : { borderColor: "var(--ink-muted)" }
                }
                aria-hidden
              >
                {item.feito ? (
                  <svg viewBox="0 0 14 14" className="h-3 w-3" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 7.4l2.8 2.8 5.2-5.6" />
                  </svg>
                ) : null}
              </span>
              <span className={`text-[14.5px] leading-[1.55] ${item.feito ? "text-ink-muted line-through" : "text-ink"}`}>
                {item.texto}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
