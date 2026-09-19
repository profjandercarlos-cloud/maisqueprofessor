import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { SubmitButton } from "@/components/submit-button";
import { StepErrorBanner } from "@/components/step-error-banner";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { ROLE_ORDER, ROLE_META } from "@/lib/possibilidades/role-meta";
import { submitSelecaoAjuste } from "./actions";

// Tela de seleção do ajuste único (2026-09): antes disparava direto pro
// fluxo de 10 perguntas do incremento, refazendo as 5 possibilidades do
// zero. Agora a pessoa escolhe primeiro o que mantém e o que troca — uma
// possibilidade com Plano já criado nunca pode ser trocada (ver
// run-generation-pipeline.ts:startSelectiveAdjustment).
export default async function AjustarConjuntoPage({
  params,
  searchParams,
}: PageProps<"/diagnostico/possibilidades/[roundId]/ajustar">) {
  const { roundId } = await params;
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  const user = await requireActiveAccess();

  const round = await db.generationRound.findUnique({
    where: { id: roundId },
    include: {
      diagnostic: true,
      possibilities: { include: { plan: true } },
    },
  });
  if (!round || round.diagnostic.userId !== user.id) notFound();
  if (round.diagnostic.incrementUsedAt) redirect(`/diagnostico/possibilidades/${roundId}`);

  const ordered = [...round.possibilities].sort(
    (a, b) => ROLE_ORDER.indexOf(a.papel) - ROLE_ORDER.indexOf(b.papel),
  );
  const podeTrocar = ordered.filter((p) => !p.plan);

  const action = submitSelecaoAjuste.bind(null, roundId);

  return (
    <div className="mx-auto w-full max-w-[680px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="AJUSTAR CONJUNTO" />
      <h1 className="mb-2 font-serif text-2xl font-medium tracking-tight text-petrol">
        O que você quer manter, e o que você quer trocar?
      </h1>
      <p className="mb-6 text-[14.5px] text-ink-muted">
        Esta é sua única rodada de ajuste. Capriche nas respostas que vêm a seguir, elas moldam diretamente as
        possibilidades novas. <strong className="font-semibold text-ink">Marque a caixa só nas que você quer
        trocar.</strong> As que você deixar sem marcar continuam exatamente como estão.
      </p>

      {podeTrocar.length === 0 ? (
        <div className="rounded-lg border border-line bg-paper-raised px-4 py-3.5 text-[14px] text-ink-muted">
          Todas as suas possibilidades atuais já têm um plano criado. Não há o que ajustar aqui.
        </div>
      ) : (
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            {ordered.map((p) => {
              const meta = ROLE_META[p.papel];
              const travada = Boolean(p.plan);
              return (
                <label
                  key={p.id}
                  className={`flex items-start gap-3 rounded-lg border px-4 py-3.5 ${
                    travada ? "border-line bg-badge-bg opacity-70" : "cursor-pointer border-line bg-paper hover:border-petrol"
                  }`}
                >
                  <span className="mt-1 flex shrink-0 flex-col items-center gap-1">
                    <input type="checkbox" name="trocar" value={p.papel} disabled={travada} className="h-4 w-4" />
                    {!travada ? (
                      <span className="text-center font-mono text-[9px] leading-tight tracking-[0.04em] text-ink-muted uppercase">
                        Trocar
                        <br />
                        esta
                      </span>
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="mb-1 inline-block rounded-full px-2 py-[2px] font-mono text-[10px] tracking-[0.06em] uppercase"
                      style={{ color: meta.accentVar, background: `color-mix(in srgb, ${meta.accentVar} 13%, var(--tint-base))` }}
                    >
                      {meta.label}
                    </span>
                    <span className="block text-[14.5px] font-medium text-ink">{p.titulo}</span>
                    <span className="block text-[13px] text-ink-muted">{p.subtitulo}</span>
                    {travada ? (
                      <span className="mt-1 block text-[12px] font-medium text-ink-muted">
                        Já tem um plano criado. Mantida automaticamente.
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>

          {error ? <StepErrorBanner error={error} /> : null}

          <div className="flex items-center justify-between gap-4 pt-2">
            <a
              href={`/diagnostico/possibilidades/${roundId}`}
              className="text-sm font-medium text-ink-muted hover:text-ink"
            >
              ← Voltar
            </a>
            <SubmitButton
              pendingText="Salvando..."
              className="rounded-lg bg-gold px-6 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
            >
              Continuar →
            </SubmitButton>
          </div>
        </form>
      )}
    </div>
  );
}
