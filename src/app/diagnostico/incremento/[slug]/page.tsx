import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { SubmitButton } from "@/components/submit-button";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { db } from "@/lib/db";
import { deepGet } from "@/lib/wizard/deep-set";
import { StepFields } from "@/components/wizard-step-fields";
import {
  getIncrementPrevSlug,
  getIncrementStepBySlug,
  getIncrementStepIndex,
  TOTAL_INCREMENT_STEPS,
} from "@/lib/diagnostico/increment-steps";
import { saveIncrementStep } from "./actions";

// Ver nota em diagnostico/concluido/page.tsx — a última pergunta deste
// fluxo também dispara geração de possibilidades.
export const maxDuration = 60;

export default async function IncrementStepPage({
  params,
  searchParams,
}: PageProps<"/diagnostico/incremento/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  const step = getIncrementStepBySlug(slug);
  if (!step) notFound();

  const user = await requireActiveAccess();

  const diagnostic = await db.diagnostic.findFirst({
    where: { userId: user.id, status: "CONCLUIDO" },
    orderBy: { createdAt: "desc" },
  });
  if (!diagnostic) notFound();
  // Só permite essa rodada extra de perguntas uma única vez por diagnóstico
  // — sem isso, a URL fixa desta tela (sem nenhum ID) podia ser visitada
  // quantas vezes quisesse, cada uma disparando uma chamada cara à IA.
  if (diagnostic.incrementUsedAt) redirect("/");

  const currentValue = deepGet(diagnostic.incrementAnswers as Record<string, unknown>, step.path);
  const index = getIncrementStepIndex(slug);
  const prevSlug = getIncrementPrevSlug(slug);
  const progressPct = Math.round(((index + 1) / TOTAL_INCREMENT_STEPS) * 100);
  const action = saveIncrementStep.bind(null, slug);

  return (
    <div className="mx-auto w-full max-w-[680px] flex-1 px-5 pb-20">
      <AppHeader progressLabel={`PERGUNTA EXTRA ${index + 1}/${TOTAL_INCREMENT_STEPS}`} />

      <div className="mb-8 h-1 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <form action={action} className="flex flex-col gap-6">
        <h1 className="font-serif text-2xl leading-snug font-medium tracking-tight text-petrol md:text-[27px]">
          {step.question}
        </h1>

        <StepFields step={step} currentValue={currentValue} />

        {error ? <p className="text-sm text-role-3">{error}</p> : null}

        <div className="flex items-center justify-between gap-4 pt-2">
          {prevSlug ? (
            <a
              href={`/diagnostico/incremento/${prevSlug}`}
              className="text-sm font-medium text-ink-muted hover:text-ink"
            >
              ← Voltar
            </a>
          ) : (
            <span />
          )}
          <SubmitButton
            pendingText={
              index === TOTAL_INCREMENT_STEPS - 1 ? "Gerando... até 1 minuto, não recarregue" : "Salvando..."
            }
            className="rounded-lg bg-gold px-6 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
          >
            {index === TOTAL_INCREMENT_STEPS - 1 ? "Gerar novo conjunto →" : "Continuar"}
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
