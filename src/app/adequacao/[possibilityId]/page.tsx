import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { getOrCreateAdequacaoResponse } from "@/lib/adequacao/get-active-response";
import { getResumeSlug } from "@/lib/adequacao/steps";

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

      <span className="mb-[18px] inline-block rounded-full bg-badge-bg px-2.5 py-[5px] font-mono text-[11px] tracking-[0.12em] text-badge-text uppercase">
        Possibilidade aprovada
      </span>
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
            O que seria, na prática
          </div>
          <div className="text-[14px] leading-[1.55] text-ink">{possibility.naPratica}</div>
        </div>
        <div>
          <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
            Por que apareceu para você
          </div>
          <div className="text-[14px] leading-[1.55] text-ink">{possibility.porQueApareceu}</div>
        </div>
        <div>
          <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
            Quem pagaria por isso
          </div>
          <div className="text-[14px] leading-[1.55] text-ink">{possibility.quemPagaria}</div>
        </div>
        <div>
          <div className="mb-1 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
            Já possui vs. o que precisaria aprender
          </div>
          <div className="text-[14px] leading-[1.55] text-ink">{possibility.jaPossuiVsAprender}</div>
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
