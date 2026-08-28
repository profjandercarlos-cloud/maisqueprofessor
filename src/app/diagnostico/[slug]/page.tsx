import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { StepFields } from "@/components/wizard-step-fields";
import { SubmitButton } from "@/components/submit-button";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { getOrCreateActiveDiagnostic } from "@/lib/diagnostico/get-active-diagnostic";
import { deepGet } from "@/lib/wizard/deep-set";
import { otherDetailPath } from "@/lib/wizard/step-types";
import { getPrevSlug, getStepBySlug, getStepIndex, getTotalSteps } from "@/lib/diagnostico/steps";
import { saveStep } from "./actions";

export default async function DiagnosticStepPage({
  params,
  searchParams,
}: PageProps<"/diagnostico/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  const user = await requireActiveAccess();

  const diagnostic = await getOrCreateActiveDiagnostic(user.id);
  if (!diagnostic) redirect("/diagnostico/concluido");
  const rota = diagnostic.rotaProfissional;

  const step = getStepBySlug(slug, rota);
  if (!step) notFound();

  const answers = diagnostic.answers as Record<string, unknown>;
  const currentValue = step.type === "intention" ? diagnostic.intention : deepGet(answers, step.path);
  const otherDetailValue =
    (step.type === "single-select" || step.type === "multi-select") && step.allowOther
      ? deepGet(answers, otherDetailPath(step.path))
      : undefined;

  const index = getStepIndex(slug, rota);
  const totalSteps = getTotalSteps(rota);
  const prevSlug = getPrevSlug(slug, rota);
  const progressPct = Math.round(((index + 1) / totalSteps) * 100);
  const action = saveStep.bind(null, slug);

  return (
    <div className="mx-auto w-full max-w-[680px] flex-1 px-5 pb-20">
      <AppHeader progressLabel={`PERGUNTA ${index + 1}/${totalSteps}`} />

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

        <StepFields step={step} currentValue={currentValue} otherDetailValue={otherDetailValue} />

        {error ? <p className="text-sm text-role-3">{error}</p> : null}

        <div className="flex items-center justify-between gap-4 pt-2">
          <a
            href={prevSlug ? `/diagnostico/${prevSlug}` : "/"}
            className="text-sm font-medium text-ink-muted hover:text-ink"
          >
            ← Voltar
          </a>
          <SubmitButton
            pendingText="Salvando..."
            className="rounded-lg bg-gold px-6 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
          >
            Continuar
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
