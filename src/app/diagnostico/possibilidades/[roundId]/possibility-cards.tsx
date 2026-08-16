"use client";

import { useState } from "react";
import { ROLE_META, ROLE_ORDER } from "@/lib/possibilidades/role-meta";
import type { PossibilityRole } from "@/generated/prisma/client";
import { approvePossibility } from "./actions";

type PossibilityData = {
  id: string;
  papel: PossibilityRole;
  titulo: string;
  naPratica: string;
  porQueApareceu: string;
  quemPagaria: string;
  jaPossuiVsAprender: string;
};

export function PossibilityCards({ possibilities }: { possibilities: PossibilityData[] }) {
  const ordered = [...possibilities].sort(
    (a, b) => ROLE_ORDER.indexOf(a.papel) - ROLE_ORDER.indexOf(b.papel),
  );
  const [openId, setOpenId] = useState<string | null>(ordered[0]?.id ?? null);

  return (
    <div className="flex flex-col gap-3">
      {ordered.map((p) => {
        const meta = ROLE_META[p.papel];
        const isOpen = openId === p.id;
        return (
          <article
            key={p.id}
            className="overflow-hidden rounded-[var(--radius-app)] border border-line bg-paper-raised shadow-[var(--shadow)] transition-shadow"
            style={{ borderLeft: `4px solid ${meta.accentVar}` }}
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : p.id)}
              aria-expanded={isOpen}
              className="flex w-full items-start gap-[15px] px-5 py-[19px] text-left"
            >
              <span
                className="mt-px flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px]"
                style={{
                  background: `color-mix(in srgb, ${meta.accentVar} 16%, var(--tint-base))`,
                  color: meta.accentVar,
                }}
              >
                {meta.icon}
              </span>
              <span className="min-w-0 flex-1 pt-0.5">
                <span
                  className="mb-2 inline-block rounded-full py-[3px] pr-[9px] pl-2 font-mono text-[10px] tracking-[0.07em] uppercase"
                  style={{
                    color: meta.accentVar,
                    background: `color-mix(in srgb, ${meta.accentVar} 13%, var(--tint-base))`,
                  }}
                >
                  {meta.label}
                </span>
                <span className="mb-1 block font-serif text-[19px] font-medium tracking-tight text-ink">
                  {p.titulo}
                </span>
                <span className="block text-[13px] text-ink-muted">{meta.subtitle}</span>
              </span>
              <span
                className="mt-[3px] flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line transition-transform"
                style={{
                  color: meta.accentVar,
                  ...(isOpen
                    ? { background: "var(--gold)", borderColor: "var(--gold)", color: "var(--petrol)", transform: "rotate(45deg)" }
                    : {}),
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
            </button>

            {isOpen ? (
              <div className="border-t border-gold-soft px-5 pt-[18px] pb-6 pl-[73px]">
                <div className="flex flex-col gap-3.5">
                  <div>
                    <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
                      O que seria, na prática
                    </div>
                    <div className="text-[14px] leading-[1.55] text-ink">{p.naPratica}</div>
                  </div>
                  <div>
                    <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
                      Por que apareceu para você
                    </div>
                    <div className="text-[14px] leading-[1.55] text-ink">{p.porQueApareceu}</div>
                  </div>
                  <div>
                    <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
                      Quem pagaria por isso
                    </div>
                    <div className="text-[14px] leading-[1.55] text-ink">{p.quemPagaria}</div>
                  </div>
                  <div>
                    <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
                      Já possui vs. o que precisaria aprender
                    </div>
                    <div className="text-[14px] leading-[1.55] text-ink">{p.jaPossuiVsAprender}</div>
                  </div>
                </div>
                <form action={approvePossibility.bind(null, p.id)}>
                  <button
                    type="submit"
                    className="mt-[18px] rounded-lg bg-petrol px-[18px] py-[11px] text-[13.5px] font-semibold text-paper transition-colors hover:bg-petrol-soft"
                  >
                    Aprovar esta possibilidade →
                  </button>
                </form>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
