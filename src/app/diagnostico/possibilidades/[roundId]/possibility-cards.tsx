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

type ConexaoMundoReal = {
  nomeDeMercado: string | null;
  reconhecimentoMercado: string;
  compradoresNomeados: string[];
};

type MarcoTemporalFinanceiro = {
  premissas: string;
  resultadoLiquidoEstimado: string;
};

type TrajetoriaFinanceira = {
  cenarioInicial: MarcoTemporalFinanceiro;
  ano1: MarcoTemporalFinanceiro;
  ano3: MarcoTemporalFinanceiro;
  ano5: MarcoTemporalFinanceiro;
  logicaDeCrescimento: string;
  riscoEstrutural: string;
  aviso: string;
};

type TempoDedicacao = {
  inicial: string;
  ano3: string;
  ano5: string;
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
  comoFunciona: string; // "A possibilidade" — já com exemplo concreto embutido
  porQueCombinaComVoce: string;
  pontoDeAtencao: string;
  dominioAplicacao: string | null;
  mecanismoComercialClasse: string | null;
  profundidade: string | null;
  conexaoMundoReal: unknown;
  trajetoriaFinanceira: unknown;
  tempoDedicacao: unknown;
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

const MECANISMO_LABELS: Record<string, string> = {
  servico_projeto: "Serviço por projeto",
  produto_digital: "Produto digital",
  software_recorrente: "Software por assinatura",
  intermediacao: "Intermediação",
  operacao_recorrente: "Operação recorrente",
  conteudo: "Conteúdo",
};

const PROFUNDIDADE_LABELS: Record<string, string> = {
  diagnostico_pontual: "Diagnóstico pontual",
  acompanhamento_recorrente: "Acompanhamento recorrente",
  uso_autonomo: "Uso autônomo",
};

function ComparisonTable({ possibilities }: { possibilities: PossibilityData[] }) {
  const ordered = [...possibilities].sort(
    (a, b) => ROLE_ORDER.indexOf(a.papel) - ROLE_ORDER.indexOf(b.papel),
  );
  const hasData = ordered.some((p) => p.dominioAplicacao || p.mecanismoComercialClasse || p.profundidade);
  if (!hasData) return null;

  return (
    <div className="mb-7 overflow-x-auto rounded-[var(--radius-app)] border border-line">
      <table className="w-full min-w-[560px] border-collapse text-[12.5px]">
        <thead>
          <tr className="bg-badge-bg text-badge-text">
            <th className="px-3 py-2 text-left font-mono text-[10px] tracking-[0.06em] uppercase">Possibilidade</th>
            <th className="px-3 py-2 text-left font-mono text-[10px] tracking-[0.06em] uppercase">Domínio</th>
            <th className="px-3 py-2 text-left font-mono text-[10px] tracking-[0.06em] uppercase">Mecanismo</th>
            <th className="px-3 py-2 text-left font-mono text-[10px] tracking-[0.06em] uppercase">Profundidade</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((p) => (
            <tr key={p.id} className="border-t border-line">
              <td className="px-3 py-2 font-medium text-ink">{p.titulo}</td>
              <td className="px-3 py-2 text-ink-muted">{p.dominioAplicacao ?? "—"}</td>
              <td className="px-3 py-2 text-ink-muted">
                {p.mecanismoComercialClasse ? (MECANISMO_LABELS[p.mecanismoComercialClasse] ?? p.mecanismoComercialClasse) : "—"}
              </td>
              <td className="px-3 py-2 text-ink-muted">
                {p.profundidade ? (PROFUNDIDADE_LABELS[p.profundidade] ?? p.profundidade) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrajetoriaBlock({ trajetoria, accentVar }: { trajetoria: TrajetoriaFinanceira; accentVar: string }) {
  const marcos: { label: string; marco: MarcoTemporalFinanceiro }[] = [
    { label: "Cenário inicial", marco: trajetoria.cenarioInicial },
    { label: "Em 1 ano", marco: trajetoria.ano1 },
    { label: "Em 3 anos", marco: trajetoria.ano3 },
    { label: "Em 5 anos", marco: trajetoria.ano5 },
  ];
  return (
    <div className="flex flex-col gap-2.5">
      {marcos.map(({ label, marco }) => (
        <div key={label} className="rounded-lg bg-paper p-3">
          <div className="mb-1 text-[11.5px] font-semibold text-ink">{label}</div>
          <div className="text-[13px] leading-[1.5] text-ink-muted">{marco.premissas}</div>
          <div className="mt-1 text-[13.5px] leading-[1.5] font-semibold text-ink">
            {marco.resultadoLiquidoEstimado}
          </div>
        </div>
      ))}
      <div className="rounded-lg p-3" style={{ background: `color-mix(in srgb, ${accentVar} 8%, var(--tint-base))` }}>
        <div className="mb-1 text-[11.5px] font-semibold text-ink">Como isso cresce</div>
        <div className="text-[13px] leading-[1.5] text-ink">{trajetoria.logicaDeCrescimento}</div>
      </div>
      <div className="rounded-lg bg-role-3/10 p-3">
        <div className="mb-1 text-[11.5px] font-semibold text-ink">Risco estrutural de longo prazo</div>
        <div className="text-[13px] leading-[1.5] text-ink">{trajetoria.riscoEstrutural}</div>
      </div>
      <p className="text-[11.5px] text-ink-muted italic">{trajetoria.aviso}</p>
    </div>
  );
}

export function PossibilityCards({ possibilities }: { possibilities: PossibilityData[] }) {
  const ordered = [...possibilities].sort(
    (a, b) => ROLE_ORDER.indexOf(a.papel) - ROLE_ORDER.indexOf(b.papel),
  );
  const [openId, setOpenId] = useState<string | null>(ordered[0]?.id ?? null);
  const [expandedInfo, setExpandedInfo] = useState<Set<string>>(new Set());

  function toggleInfo(id: string) {
    setExpandedInfo((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <ComparisonTable possibilities={ordered} />
      <div className="flex flex-col gap-3">
        {ordered.map((p) => {
          const meta = ROLE_META[p.papel];
          const isOpen = openId === p.id;
          const infoOpen = expandedInfo.has(p.id);
          const conexao = p.conexaoMundoReal as ConexaoMundoReal | null;
          const trajetoria = p.trajetoriaFinanceira as TrajetoriaFinanceira | null;
          const tempoDedicacao = p.tempoDedicacao as TempoDedicacao | null;

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
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
                        A possibilidade
                      </div>
                      <div className="text-[14px] leading-[1.55] text-ink">{p.comoFunciona}</div>
                    </div>

                    {conexao ? (
                      <div className="rounded-[10px] border border-line bg-badge-bg p-3.5">
                        <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-badge-text uppercase">
                          Conexão com o mundo real
                        </div>
                        {conexao.nomeDeMercado ? (
                          <div className="mb-1.5 text-[14px] leading-[1.55] font-semibold text-ink">
                            {conexao.nomeDeMercado}
                          </div>
                        ) : null}
                        <div className="mb-2 text-[13.5px] leading-[1.5] text-ink">
                          {conexao.reconhecimentoMercado}
                        </div>
                        <div className="mb-1.5 text-[12px] font-semibold text-ink">Quem compraria</div>
                        <ul className="flex flex-col gap-1">
                          {conexao.compradoresNomeados.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-[13.5px] leading-[1.5] text-ink">
                              <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-badge-text" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {trajetoria ? (
                      <div>
                        <div className="mb-2 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
                          Geração de receita
                        </div>
                        <TrajetoriaBlock trajetoria={trajetoria} accentVar={meta.accentVar} />
                      </div>
                    ) : null}

                    {tempoDedicacao ? (
                      <div>
                        <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
                          Tempo e dedicação necessária
                        </div>
                        <div className="flex flex-col gap-1 text-[13.5px] leading-[1.5] text-ink">
                          <div>
                            <span className="font-semibold">Início: </span>
                            {tempoDedicacao.inicial}
                          </div>
                          <div>
                            <span className="font-semibold">Em 3 anos: </span>
                            {tempoDedicacao.ano3}
                          </div>
                          <div>
                            <span className="font-semibold">Em 5 anos: </span>
                            {tempoDedicacao.ano5}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="border-t border-line pt-3.5">
                      <button
                        type="button"
                        onClick={() => toggleInfo(p.id)}
                        aria-expanded={infoOpen}
                        className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-muted hover:text-ink"
                      >
                        {infoOpen ? "Ocultar" : "Ver"} por que combina com você e o ponto de atenção
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                          style={{ transform: infoOpen ? "rotate(180deg)" : undefined }}
                        >
                          <path d="M1.5 3.5L5 7l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      </button>

                      {infoOpen ? (
                        <div className="mt-3 flex flex-col gap-3">
                          <div>
                            <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
                              Por que combina com você
                            </div>
                            <div className="text-[14px] leading-[1.55] text-ink">{p.porQueCombinaComVoce}</div>
                          </div>
                          <div>
                            <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
                              Ponto de atenção
                            </div>
                            <div className="text-[14px] leading-[1.55] text-ink">{p.pontoDeAtencao}</div>
                          </div>
                        </div>
                      ) : null}
                    </div>
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
    </>
  );
}
