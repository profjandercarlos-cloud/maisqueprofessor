import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { PossibilityCards } from "./possibility-cards";

const MAX_ADJUSTMENT_ROUNDS = 3;

export default async function PossibilitiesReviewPage({
  params,
}: PageProps<"/diagnostico/possibilidades/[roundId]">) {
  const { roundId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const round = await db.generationRound.findUnique({
    where: { id: roundId },
    include: { possibilities: true, diagnostic: true },
  });
  if (!round || round.diagnostic.userId !== user.id) notFound();

  const adjustmentsUsed = round.roundNumber - 1;
  const adjustmentsRemaining = Math.max(0, MAX_ADJUSTMENT_ROUNDS - adjustmentsUsed);
  const alreadyApproved = round.possibilities.some((p) => p.status === "APROVADA");

  return (
    <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="ETAPA 03 / 10" />

      <div className="mb-11">
        <span className="mb-[18px] inline-block rounded-full bg-badge-bg px-2.5 py-[5px] font-mono text-[11px] tracking-[0.12em] text-badge-text uppercase">
          Seu diagnóstico está pronto
        </span>
        <h1 className="mb-3.5 font-serif text-[clamp(28px,5vw,38px)] leading-[1.15] font-medium tracking-tight text-petrol">
          Cinco possibilidades.
          <br />
          Uma delas <em className="text-gold not-italic italic">é sua</em>.
        </h1>
        <p className="max-w-[46ch] text-[15.5px] text-ink-muted">
          Cada uma nasce de um ângulo diferente do que você respondeu — não são cinco variações da
          mesma ideia. Abra e veja o que reconhece em você.
        </p>
      </div>

      {!alreadyApproved ? (
        <div className="mb-7 flex items-start gap-2.5 rounded-[var(--radius-app)] border border-line bg-paper-raised px-4 py-3.5 text-[13.5px] text-ink-muted">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
            <circle cx="8" cy="8" r="7" stroke="var(--gold)" strokeWidth="1.4" />
            <path d="M8 7v4.5M8 4.8v.1" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span>
            Isto não é um ranking. Observe o que desperta reconhecimento em cada uma e reaja com
            sinceridade — isso ajuda a refinar as próximas.
          </span>
        </div>
      ) : null}

      <PossibilityCards possibilities={round.possibilities} />

      {alreadyApproved ? (
        <footer className="mt-9 rounded-[var(--radius-app)] border border-line bg-paper-raised px-5 py-[18px]">
          <p className="text-[14px] font-semibold text-ink">Possibilidade aprovada.</p>
          <p className="text-[12.5px] text-ink-muted">Vamos seguir para o próximo passo.</p>
        </footer>
      ) : adjustmentsRemaining > 0 ? (
        <footer className="mt-9 flex flex-col items-start justify-between gap-4 rounded-[var(--radius-app)] border border-line bg-paper-raised px-5 py-[18px] sm:flex-row sm:items-center">
          <div>
            <p className="text-[14px] font-semibold text-ink">Nenhuma delas conversa o suficiente com você?</p>
            <p className="text-[12.5px] text-ink-muted">
              Você pode ajustar o conjunto — restam {adjustmentsRemaining}{" "}
              {adjustmentsRemaining === 1 ? "rodada" : "rodadas"}.
            </p>
          </div>
          <a
            href={`/diagnostico/possibilidades/${round.id}/ajustar`}
            className="text-[13.5px] font-semibold whitespace-nowrap text-petrol hover:underline"
          >
            Ajustar conjunto →
          </a>
        </footer>
      ) : (
        <footer className="mt-9 flex flex-col items-start justify-between gap-4 rounded-[var(--radius-app)] border border-line bg-paper-raised px-5 py-[18px] sm:flex-row sm:items-center">
          <div>
            <p className="text-[14px] font-semibold text-ink">Ainda nenhuma delas é a sua?</p>
            <p className="text-[12.5px] text-ink-muted">
              As rodadas de ajuste acabaram — algumas perguntas extras podem ajudar a fechar isso.
            </p>
          </div>
          <a
            href="/diagnostico/incremento/incremento-1"
            className="text-[13.5px] font-semibold whitespace-nowrap text-petrol hover:underline"
          >
            Responder perguntas extras →
          </a>
        </footer>
      )}
    </div>
  );
}
