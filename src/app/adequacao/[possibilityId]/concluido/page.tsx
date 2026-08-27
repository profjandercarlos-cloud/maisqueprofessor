import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { getOrCreateAdequacaoResponse } from "@/lib/adequacao/get-active-response";
import { getResumeSlug } from "@/lib/adequacao/steps";
import { generatePlan } from "./actions";

// Ver nota em diagnostico/concluido/page.tsx — sem isto a Vercel mata a
// função aos 10s, e o plano de 12 semanas leva bem mais que isso pra gerar.
export const maxDuration = 60;

export default async function AdequacaoConcluidoPage({
  params,
  searchParams,
}: PageProps<"/adequacao/[possibilityId]/concluido">) {
  const { possibilityId } = await params;
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  const user = await requireActiveAccess();

  const possibility = await db.possibility.findUnique({
    where: { id: possibilityId },
    include: { round: { include: { diagnostic: true } }, plan: true },
  });
  if (!possibility || possibility.round.diagnostic.userId !== user.id) notFound();
  if (possibility.plan) redirect(`/planos/${possibility.plan.id}`);

  const response = await getOrCreateAdequacaoResponse(possibilityId);
  const resumeSlug = getResumeSlug(response.answers as Record<string, unknown>);
  if (resumeSlug !== "concluido") {
    redirect(`/adequacao/${possibilityId}/${resumeSlug}`);
  }

  const action = generatePlan.bind(null, possibilityId);

  return (
    <div className="mx-auto w-full max-w-[680px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="SEU PLANO JÁ PODE SER CALIBRADO" />

      <span className="mb-[18px] inline-block rounded-full bg-badge-bg px-2.5 py-[5px] font-mono text-[11px] tracking-[0.12em] text-badge-text uppercase">
        Possibilidade aprovada
      </span>
      <h1 className="mb-2 font-serif text-2xl leading-snug font-medium tracking-tight text-petrol md:text-[27px]">
        {possibility.titulo}
      </h1>
      <p className="mb-8 max-w-[55ch] text-[14.5px] text-ink-muted">
        Vamos usar sua possibilidade escolhida, seu ponto de partida e as condições que você informou para
        montar um plano de 12 semanas que produza evidências reais sem ultrapassar sua disponibilidade.
      </p>

      <form action={action}>
        {error ? <p className="mb-4 text-sm text-role-3">{error}</p> : null}
        <SubmitButton
          pendingText="Gerando seu plano... isso pode levar até 1 minuto, não recarregue a página"
          className="rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-gold-soft"
        >
          Criar meu plano de 12 semanas →
        </SubmitButton>
      </form>
    </div>
  );
}
