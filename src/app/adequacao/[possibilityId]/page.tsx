import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { getOrCreateAdequacaoResponse } from "@/lib/adequacao/get-active-response";
import { getResumeSlug } from "@/lib/adequacao/steps";
import { ROLE_META } from "@/lib/possibilidades/role-meta";

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
            color: ROLE_META[possibility.papel].accentVar,
            background: `color-mix(in srgb, ${ROLE_META[possibility.papel].accentVar} 13%, var(--tint-base))`,
          }}
        >
          {ROLE_META[possibility.papel].icon}
          {ROLE_META[possibility.papel].label}
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
            O que você faria na prática
          </div>
          <div className="text-[14px] leading-[1.55] text-ink">{possibility.naPratica}</div>
        </div>
        <div>
          <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
            O que você entregaria
          </div>
          <div className="text-[14px] leading-[1.55] text-ink">{possibility.entregaPrincipal}</div>
        </div>
        <div>
          <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
            Quem pagaria e por quê
          </div>
          <div className="text-[14px] leading-[1.55] text-ink">{possibility.quemPagaria}</div>
        </div>
        <div>
          <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
            Como seria sua rotina
          </div>
          <div className="text-[14px] leading-[1.55] text-ink">{possibility.comoSeriaRotina}</div>
        </div>
        <div>
          <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
            Por que apareceu para você
          </div>
          <div className="text-[14px] leading-[1.55] text-ink">{possibility.porQueApareceu}</div>
        </div>
        <div>
          <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
            O que você já traz e o que precisaria desenvolver
          </div>
          <ul className="flex flex-col gap-1">
            {possibility.capacidadesAproveitaveis.map((item, i) => (
              <li key={`c-${i}`} className="flex items-start gap-2 text-[14px] leading-[1.55] text-ink">
                <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-petrol" />
                {item}
              </li>
            ))}
            {possibility.aprendizagensPrioritarias.map((item, i) => (
              <li key={`a-${i}`} className="flex items-start gap-2 text-[14px] leading-[1.55] text-ink-muted">
                <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-gold" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
            Primeira versão possível
          </div>
          <div className="text-[14px] leading-[1.55] text-ink">{possibility.primeiraVersaoPossivel}</div>
        </div>
        <div>
          <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
            Principal ponto de atenção
          </div>
          <div className="text-[14px] leading-[1.55] text-ink">{possibility.pontoDeAtencao}</div>
        </div>
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
