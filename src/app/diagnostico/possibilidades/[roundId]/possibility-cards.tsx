"use client";

import { useState } from "react";
import { ROLE_META, ROLE_ORDER } from "@/lib/possibilidades/role-meta";
import type {
  HorizonteEconomico,
  NivelLastro,
  PossibilityRole,
  PossibilityStatus,
} from "@/generated/prisma/client";
import { approvePossibility } from "./actions";

type AnaliseConvergenciaComercial = {
  porQueSeDestaca: string;
  horizontePrincipal: string;
  justificativaHorizonte: string;
  logicaParaMeta: string;
  contaDeReferencia: string | null;
  condicoesParaConfirmar: string[];
  principalRiscoComercial: string;
  nivelConfiancaComercial: string;
};

type PossibilityData = {
  id: string;
  papel: PossibilityRole;
  titulo: string;
  subtitulo: string;
  tempoPrimeiraValidacao: HorizonteEconomico;
  horizonteRelevanciaFinanceira: HorizonteEconomico;
  baseNoHistorico: NivelLastro;
  destaque: boolean;
  comoFunciona: string; // bloco 1 — "A possibilidade"
  comoGerarReceita: string; // bloco 3 — "Como pode gerar receita"
  porQueCombinaComVoce: string; // bloco 2 — "Por que combina com você"
  primeiraValidacao: string; // bloco 4 — "Como validar sem construir tudo"
  pontoDeAtencao: string; // bloco 5 — "Ponto de atenção"
  analiseConvergenciaComercial: unknown;
  status: PossibilityStatus;
};

const HORIZONTE_LABELS: Record<HorizonteEconomico, string> = {
  CURTO_PRAZO: "Curto prazo",
  MEDIO_PRAZO: "Médio prazo",
  LONGO_PRAZO: "Longo prazo",
  A_VALIDAR: "A validar",
};

const LASTRO_LABELS: Record<NivelLastro, string> = {
  FORTE: "Base forte",
  MODERADO: "Base moderada",
  EXPLORATORIO: "Exploratório",
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
        const convergencia = p.destaque
          ? (p.analiseConvergenciaComercial as AnaliseConvergenciaComercial | null)
          : null;
        return (
          <article
            key={p.id}
            className="overflow-hidden rounded-[var(--radius-app)] border bg-paper-raised shadow-[var(--shadow)] transition-shadow"
            style={{
              borderLeft: `4px solid ${meta.accentVar}`,
              borderTop: p.destaque ? `1px solid ${meta.accentVar}` : undefined,
              borderRight: p.destaque ? `1px solid ${meta.accentVar}` : undefined,
              borderBottom: p.destaque ? `1px solid ${meta.accentVar}` : undefined,
              borderColor: p.destaque ? undefined : "var(--line)",
            }}
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
                <span className="mb-2 flex flex-wrap items-center gap-1.5">
                  <span
                    className="inline-block rounded-full py-[3px] pr-[9px] pl-2 font-mono text-[10px] tracking-[0.07em] uppercase"
                    style={{
                      color: meta.accentVar,
                      background: `color-mix(in srgb, ${meta.accentVar} 13%, var(--tint-base))`,
                    }}
                  >
                    {meta.label}
                  </span>
                  <span className="inline-block rounded-full bg-badge-bg px-2 py-[3px] text-[10px] font-medium text-badge-text">
                    Tempo para validar: {HORIZONTE_LABELS[p.tempoPrimeiraValidacao]}
                  </span>
                  {p.horizonteRelevanciaFinanceira !== "A_VALIDAR" ? (
                    <span className="inline-block rounded-full bg-badge-bg px-2 py-[3px] text-[10px] font-medium text-badge-text">
                      Maturação financeira: {HORIZONTE_LABELS[p.horizonteRelevanciaFinanceira]}
                    </span>
                  ) : null}
                  <span className="inline-block rounded-full bg-badge-bg px-2 py-[3px] text-[10px] font-medium text-badge-text">
                    Base no seu histórico: {LASTRO_LABELS[p.baseNoHistorico]}
                  </span>
                </span>
                <span className="mb-1 block font-serif text-[19px] font-medium tracking-tight text-ink">
                  {p.titulo}
                </span>
                <span className="block text-[13px] text-ink-muted">{p.subtitulo}</span>
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
                      A possibilidade
                    </div>
                    <div className="text-[14px] leading-[1.55] text-ink">{p.comoFunciona}</div>
                  </div>
                  <div>
                    <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
                      Por que combina com você
                    </div>
                    <div className="text-[14px] leading-[1.55] text-ink">{p.porQueCombinaComVoce}</div>
                  </div>
                  <div>
                    <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
                      Como pode gerar receita
                    </div>
                    <div className="text-[14px] leading-[1.55] text-ink">{p.comoGerarReceita}</div>
                  </div>
                  <div>
                    <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
                      Como validar sem construir tudo
                    </div>
                    <div className="text-[14px] leading-[1.55] text-ink">{p.primeiraValidacao}</div>
                  </div>
                  <div>
                    <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
                      Ponto de atenção
                    </div>
                    <div className="text-[14px] leading-[1.55] text-ink">{p.pontoDeAtencao}</div>
                  </div>

                  {convergencia ? (
                    <div
                      className="rounded-[10px] border p-3.5"
                      style={{
                        borderColor: meta.accentVar,
                        background: `color-mix(in srgb, ${meta.accentVar} 8%, var(--tint-base))`,
                      }}
                    >
                      <div
                        className="mb-1 font-mono text-[10px] tracking-[0.06em] uppercase"
                        style={{ color: meta.accentVar }}
                      >
                        Análise de convergência comercial
                      </div>
                      <div className="mb-2.5 text-[14px] leading-[1.55] text-ink">
                        {convergencia.porQueSeDestaca}
                      </div>
                      <div className="mb-1.5 text-[12px] font-semibold text-ink">
                        Condições para confirmar
                      </div>
                      <ul className="mb-2.5 flex flex-col gap-1">
                        {convergencia.condicoesParaConfirmar.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-[13.5px] leading-[1.5] text-ink">
                            <span
                              className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full"
                              style={{ background: meta.accentVar }}
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <div className="text-[13.5px] leading-[1.5] text-ink">
                        <span className="font-semibold">Principal risco comercial: </span>
                        {convergencia.principalRiscoComercial}
                      </div>
                    </div>
                  ) : null}
                </div>
                {p.status === "REJEITADA" ? (
                  <p className="mt-[18px] text-[13px] text-ink-muted">
                    Essa possibilidade já foi tentada antes e não pôde ser aproveitada — escolha outra do
                    conjunto.
                  </p>
                ) : (
                  <form action={approvePossibility.bind(null, p.id)}>
                    <button
                      type="submit"
                      className="mt-[18px] rounded-lg bg-gold px-[18px] py-[11px] text-[13.5px] font-semibold text-paper transition-colors hover:opacity-90"
                    >
                      Quero explorar esta possibilidade →
                    </button>
                  </form>
                )}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
