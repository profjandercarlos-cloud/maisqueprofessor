import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { StepFields } from "@/components/wizard-step-fields";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { getOrCreateAdequacaoResponse } from "@/lib/adequacao/get-active-response";
import { getPrevSlug, getStepBySlug, getStepIndex, TOTAL_STEPS } from "@/lib/adequacao/steps";
import { deepGet } from "@/lib/wizard/deep-set";
import { saveStep } from "./actions";

export default async function AdequacaoStepPage({
  params,
  searchParams,
}: PageProps<"/adequacao/[possibilityId]/[slug]">) {
  const { possibilityId, slug } = await params;
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  const step = getStepBySlug(slug);
  if (!step) notFound();

  const user = await requireActiveAccess();

  const possibility = await db.possibility.findUnique({
    where: { id: possibilityId },
    include: { round: { include: { diagnostic: true } }, plan: true },
  });
  if (!possibility || possibility.round.diagnostic.userId !== user.id) notFound();
  if (possibility.plan) redirect(`/planos/${possibility.plan.id}`);

  const response = await getOrCreateAdequacaoResponse(possibilityId);
  const answers = response.answers as Record<string, unknown>;
  const currentValue = step.type === "intention" ? undefined : deepGet(answers, step.path);

  const index = getStepIndex(slug);
  const prevSlug = getPrevSlug(slug);
  const progressPct = Math.round(((index + 1) / TOTAL_STEPS) * 100);
  const action = saveStep.bind(null, possibilityId, slug);

  return (
    <div className="mx-auto w-full max-w-[680px] flex-1 px-5 pb-20">
      <AppHeader progressLabel={`AJUSTE ${index + 1}/${TOTAL_STEPS}`} />

      <div className="mb-8 h-1 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <form action={action} className="flex flex-col gap-6">
        <div>
          <h1 className="mb-2 font-serif text-2xl leading-snug font-medium tracking-tight text-petrol md:text-[27px]">
            {step.question}
            {"optional" in step && step.optional ? (
              <span className="ml-2 align-middle font-sans text-[13px] font-normal text-ink-muted">
                (opcional)
              </span>
            ) : null}
          </h1>
          {"helper" in step && step.helper ? (
            <p className="text-[14.5px] text-ink-muted">{step.helper}</p>
          ) : null}
        </div>

        <StepFields step={step} currentValue={currentValue} />

        {error ? <p className="text-sm text-role-3">{error}</p> : null}

        <div className="flex items-center justify-between gap-4 pt-2">
          <a
            href={prevSlug ? `/adequacao/${possibilityId}/${prevSlug}` : `/adequacao/${possibilityId}`}
            className="text-sm font-medium text-ink-muted hover:text-ink"
          >
            ← Voltar
          </a>
          <SubmitButton
            pendingText="Salvando..."
            className="rounded-lg bg-gold px-6 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-gold-soft"
          >
            Continuar
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
