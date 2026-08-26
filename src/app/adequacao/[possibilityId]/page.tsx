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
      <h1 className="mb-2 font-serif text-2xl leading-snug font-medium tracking-tight text-petrol md:text-[27px]">
        {possibility.titulo}
      </h1>
      <p className="mb-8 max-w-[50ch] text-[14.5px] text-ink-muted">
        Só mais algumas perguntas para calibrar o plano ao seu tempo, aos seus recursos e ao seu jeito de acompanhar.
      </p>

      <a
        href={`/adequacao/${possibilityId}/${resumeSlug}`}
        className="inline-block rounded-lg bg-petrol px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-petrol-soft"
      >
        Ajustar meu plano →
      </a>
    </div>
  );
}
