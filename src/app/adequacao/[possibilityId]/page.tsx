import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { getOrCreateAdequacaoResponse } from "@/lib/adequacao/get-active-response";
import { getResumeSlug } from "@/lib/adequacao/steps";
import { ROLE_META } from "@/lib/possibilidades/role-meta";
import type { HorizonteEconomico, NivelLastro } from "@/generated/prisma/client";

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

export default async function AdequacaoEntryPage({
  params,
}: PageProps<"/adequacao/[possibilityId]">) {
  const { possibilityId } = await params;

  const user = await requireActiveAccess();

  const possibility = await db.possibility.findUnique({
    where: { id: possibilityId },
    include: { round: { include: { diagnostic: true } }, plan: true },
  });
  if (!possibility || possibility.round.diagnostic.userId !== user.id) notFound();
  if (possibility.plan) redirect(`/planos/${possibility.plan.id}`);

  const response = await getOrCreateAdequacaoResponse(possibilityId);

  if (response.status === "CONCLUIDO") {
    redirect(`/adequacao/${possibilityId}/concluido`);
  }

  const resumeSlug = getResumeSlug(response.answers as Record<string, unknown>);
  const convergencia = possibility.destaque
    ? (possibility.analiseConvergenciaComercial as unknown as AnaliseConvergenciaComercial | null)
    : null;
  const meta = ROLE_META[possibility.papel];

  return (
    <div className="mx-auto w-full max-w-[680px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="POSSIBILIDADE APROVADA" />

      {/* De onde essa possibilidade veio (um dos 5 papéis fixos) — ver
          mesmo raciocínio em planos/[planId]/page.tsx. */}
      <div className="mb-[18px] flex flex-wrap items-center gap-2">
        <span className="inline-block rounded-full bg-badge-bg px-2.5 py-[5px] font-mono text-[11px] tracking-[0.12em] text-badge-text uppercase">
          Possibilidade aprovada
        </span>
        <span
          className="inline-flex items-center gap-1.5 rounded-full py-[3px] pr-[9px] pl-2 font-mono text-[10px] tracking-[0.07em] uppercase"
          style={{
            color: meta.accentVar,
            background: `color-mix(in srgb, ${meta.accentVar} 13%, var(--tint-base))`,
          }}
        >
          {meta.icon}
          {meta.label}
        </span>
        <span className="inline-block rounded-full bg-badge-bg px-2 py-[3px] text-[10px] font-medium text-badge-text">
          Tempo para validar: {HORIZONTE_LABELS[possibility.tempoPrimeiraValidacao]}
        </span>
        {possibility.horizonteRelevanciaFinanceira !== "A_VALIDAR" ? (
          <span className="inline-block rounded-full bg-badge-bg px-2 py-[3px] text-[10px] font-medium text-badge-text">
            Maturação financeira: {HORIZONTE_LABELS[possibility.horizonteRelevanciaFinanceira]}
          </span>
        ) : null}
        <span className="inline-block rounded-full bg-badge-bg px-2 py-[3px] text-[10px] font-medium text-badge-text">
          Base no seu histórico: {LASTRO_LABELS[possibility.baseNoHistorico]}
        </span>
      </div>
      <h1 className="mb-6 font-serif text-2xl leading-snug font-medium tracking-tight text-petrol md:text-[27px]">
        {possibility.titulo}
      </h1>

      {/* Recapitula o que essa possibilidade é antes de pedir pra pessoa
          decidir prosseguir — sem isso, quem chega aqui a partir de "Meus
          planos" (às vezes dias depois de ter visto o conjunto original de
          5 possibilidades) não tem como lembrar do que se trata. */}
      <div className="mb-8 flex flex-col gap-3.5 rounded-[var(--radius-app)] border border-line bg-paper-raised p-5 shadow-[var(--shadow)]">
        <div>
          <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
            A possibilidade
          </div>
          <div className="text-[14px] leading-[1.55] text-ink">{possibility.comoFunciona}</div>
        </div>
        <div>
          <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
            Por que combina com você
          </div>
          <div className="text-[14px] leading-[1.55] text-ink">{possibility.porQueCombinaComVoce}</div>
        </div>
        <div>
          <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
            Como pode gerar receita
          </div>
          <div className="text-[14px] leading-[1.55] text-ink">{possibility.comoGerarReceita}</div>
        </div>
        <div>
          <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
            Como validar sem construir tudo
          </div>
          <div className="text-[14px] leading-[1.55] text-ink">{possibility.primeiraValidacao}</div>
        </div>
        <div>
          <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
            Ponto de atenção
          </div>
          <div className="text-[14px] leading-[1.55] text-ink">{possibility.pontoDeAtencao}</div>
        </div>

        {convergencia ? (
          <div
            className="rounded-[10px] border p-3.5"
            style={{
              borderColor: meta.accentVar,
              background: `color-mix(in srgb, ${meta.accentVar} 8%, var(--tint-base))`,
            }}
          >
            <div className="mb-1 font-mono text-[10px] tracking-[0.06em] uppercase" style={{ color: meta.accentVar }}>
              Análise de convergência comercial
            </div>
            <div className="mb-2.5 text-[14px] leading-[1.55] text-ink">{convergencia.porQueSeDestaca}</div>
            <div className="mb-1.5 text-[12px] font-semibold text-ink">Condições para confirmar</div>
            <ul className="mb-2.5 flex flex-col gap-1">
              {convergencia.condicoesParaConfirmar.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[13.5px] leading-[1.5] text-ink">
                  <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full" style={{ background: meta.accentVar }} />
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

      <p className="mb-4 max-w-[50ch] text-[14.5px] text-ink-muted">
        Se essa continua sendo a possibilidade que faz sentido pra você, só mais algumas perguntas para calibrar o
        plano ao seu tempo, aos seus recursos e ao seu jeito de acompanhar.
      </p>

      <a
        href={`/adequacao/${possibilityId}/${resumeSlug}`}
        className="inline-block rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-paper transition-colors hover:opacity-90"
      >
        Ajustar meu plano →
      </a>
    </div>
  );
}
