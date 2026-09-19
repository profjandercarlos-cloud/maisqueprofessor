import { notFound } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { PossibilityCards } from "./possibility-cards";
import { PollingWait } from "./polling-wait";
import { MarketPresentationRetry } from "./market-presentation-retry";
import { MacroNichoReport } from "./macro-nicho-report";

// Reduzido de 3 rodadas de ajuste (caixa de texto livre) para uma única
// rodada de ajuste (motor "Sol" custa ~2x mais que o anterior) — compensado
// fazendo dessa única rodada o fluxo de perguntas estruturadas do
// incremento (mais denso), não mais um último recurso após 3 tentativas
// rasas. Gating é via diagnostic.incrementUsedAt: uma vez usado, não há mais
// ajuste disponível. Ver diagnostico/incremento/[slug].

export default async function PossibilitiesReviewPage({
  params,
  searchParams,
}: PageProps<"/diagnostico/possibilidades/[roundId]">) {
  const { roundId } = await params;
  const query = await searchParams;
  const conflito = typeof query.conflito === "string" ? query.conflito : undefined;

  const user = await requireActiveAccess();

  const round = await db.generationRound.findUnique({
    where: { id: roundId },
    include: { possibilities: true, diagnostic: true },
  });
  if (!round || round.diagnostic.userId !== user.id) notFound();

  const EM_ANDAMENTO = ["PENDENTE", "GERANDO", "VALIDANDO", "CORRIGINDO", "PROCESSANDO"];
  if (EM_ANDAMENTO.includes(round.status)) {
    return (
      <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
        <AppHeader progressLabel="ETAPA 03 / 10" />
        <div className="mb-11">
          <span className="mb-[18px] inline-block rounded-full bg-badge-bg px-2.5 py-[5px] font-mono text-[11px] tracking-[0.12em] text-badge-text uppercase">
            Preparando seu diagnóstico
          </span>
          <h1 className="mb-3.5 font-serif text-[clamp(28px,5vw,38px)] leading-[1.15] font-medium tracking-tight text-petrol">
            Cinco possibilidades a caminho.
          </h1>
          <p className="max-w-[46ch] text-[15.5px] text-ink-muted">
            Estamos analisando suas respostas com cuidado. Não feche esta página, ela vai se
            atualizar sozinha assim que estiver pronta.
          </p>
        </div>
        <PollingWait roundId={round.id} status={round.status} updatedAtIso={round.updatedAt.toISOString()} />
      </div>
    );
  }

  if (round.status === "FALHOU") {
    return (
      <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
        <AppHeader progressLabel="ETAPA 03 / 10" />
        <div className="mb-11">
          <h1 className="mb-3.5 font-serif text-[clamp(28px,5vw,38px)] leading-[1.15] font-medium tracking-tight text-petrol">
            Não conseguimos gerar suas possibilidades agora.
          </h1>
          <p className="max-w-[46ch] text-[15.5px] text-ink-muted">
            Algo deu errado durante a geração. Você pode tentar novamente, nada do que você
            respondeu foi perdido.
          </p>
        </div>
        <Link
          href="/diagnostico/concluido"
          className="inline-block rounded-full bg-petrol px-5 py-2.5 text-[13.5px] font-semibold text-white hover:opacity-90"
        >
          Tentar novamente →
        </Link>
      </div>
    );
  }

  const canAdjust = !round.diagnostic.incrementUsedAt;
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
          Cada uma nasce de um ângulo diferente do que você respondeu, não são cinco variações da
          mesma ideia. Abra e veja o que reconhece em você.
        </p>
      </div>

      {conflito ? (
        <div className="mb-7 flex items-start gap-2.5 rounded-[var(--radius-app)] border border-role-3/40 bg-role-3/10 px-4 py-3.5 text-[13.5px] text-ink">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
            <circle cx="8" cy="8" r="7" stroke="var(--role-3)" strokeWidth="1.4" />
            <path d="M8 7v4.5M8 4.8v.1" stroke="var(--role-3)" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span>
            <strong className="font-semibold">Essa possibilidade não coube nas condições que você informou:</strong>{" "}
            {conflito} Escolha outra possibilidade do conjunto abaixo.
          </span>
        </div>
      ) : null}

      {!alreadyApproved ? (
        <div className="mb-7 flex items-start gap-2.5 rounded-[var(--radius-app)] border border-line bg-paper-raised px-4 py-3.5 text-[13.5px] text-ink-muted">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
            <circle cx="8" cy="8" r="7" stroke="var(--gold)" strokeWidth="1.4" />
            <path d="M8 7v4.5M8 4.8v.1" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span>
            Isto não é um ranking. Observe o que desperta reconhecimento em cada uma e reaja com
            sinceridade, isso ajuda a refinar as próximas.
          </span>
        </div>
      ) : null}

      {round.avisoEconomico ? (
        <div className="mb-7 flex items-start gap-2.5 rounded-[var(--radius-app)] border border-line bg-paper-raised px-4 py-3.5 text-[13.5px] text-ink-muted">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
            <circle cx="8" cy="8" r="7" stroke="var(--role-2)" strokeWidth="1.4" />
            <path d="M8 5v4M8 11v.1" stroke="var(--role-2)" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span>{round.avisoEconomico}</span>
        </div>
      ) : null}

      <MacroNichoReport macroNicho={round.macroNicho} premissasFinanceirasGerais={round.premissasFinanceirasGerais} />

      {!round.macroNicho ? (
        // Retomada da antiga camada aditiva de mercado — só relevante pra
        // rodadas geradas antes do motor "macro nicho" (2026-09), que já
        // embute conexão com mercado + trajetória financeira na própria
        // geração e não depende mais dessa fase separada.
        <MarketPresentationRetry
          roundId={round.id}
          needsRetry={
            round.possibilities.length === 5 &&
            round.possibilities.some((p) => p.analiseMercadoAmpliada === null)
          }
        />
      ) : null}
      <PossibilityCards possibilities={round.possibilities} />

      {alreadyApproved ? (
        <footer className="mt-9 rounded-[var(--radius-app)] border border-line bg-paper-raised px-5 py-[18px]">
          <p className="text-[14px] font-semibold text-ink">Possibilidade aprovada.</p>
          <p className="text-[12.5px] text-ink-muted">Vamos seguir para o próximo passo.</p>
        </footer>
      ) : canAdjust ? (
        <footer className="mt-9 flex flex-col items-start justify-between gap-4 rounded-[var(--radius-app)] border border-line bg-paper-raised px-5 py-[18px] sm:flex-row sm:items-center">
          <div>
            <p className="text-[14px] font-semibold text-ink">Quer ajustar alguma dessas possibilidades?</p>
            <p className="text-[12.5px] text-ink-muted">
              Você tem uma rodada de ajuste. Escolha quais possibilidades quer manter e quais possibilidades quer
              trocar, e responda algumas perguntas extras para essa troca ser mais certeira.
            </p>
          </div>
          <Link
            href={`/diagnostico/possibilidades/${round.id}/ajustar`}
            className="text-[13.5px] font-semibold whitespace-nowrap text-petrol hover:underline"
          >
            Ajustar conjunto →
          </Link>
        </footer>
      ) : (
        <footer className="mt-9 rounded-[var(--radius-app)] border border-line bg-paper-raised px-5 py-[18px]">
          <p className="text-[14px] font-semibold text-ink">Ainda nenhuma delas é a sua?</p>
          <p className="text-[12.5px] text-ink-muted">
            Sua rodada de ajuste já foi usada. Se nenhuma das cinco atuais fizer sentido, entre em contato pelo
            suporte.
          </p>
        </footer>
      )}
    </div>
  );
}
