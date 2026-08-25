import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { formatDate } from "@/lib/format-date";
import { REPORT_SECTIONS, type Relatorio } from "@/lib/plano/relatorio";
import { PlanEvolucao } from "@/components/plan-evolucao";

export default async function PlanPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;

  const user = await requireActiveAccess();

  const plan = await db.plan.findUnique({
    where: { id: planId },
    include: {
      possibility: true,
      weeks: {
        orderBy: { weekNumber: "asc" },
        include: { checkin: true, tasks: { orderBy: { sequencia: "asc" } } },
      },
      tasks: { select: { status: true } },
      milestones: { orderBy: { sequencia: "asc" } },
    },
  });
  if (!plan || plan.userId !== user.id) notFound();

  const relatorio = plan.relatorio as unknown as Relatorio;
  const hasCheckinDue = plan.weeks.some((w) => w.status === "PENDENTE" && !w.checkin);

  return (
    <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="ETAPA 07 / 10" />

      <span className="mb-[18px] inline-block rounded-full bg-badge-bg px-2.5 py-[5px] font-mono text-[11px] tracking-[0.12em] text-badge-text uppercase">
        Relatório completo
      </span>
      <h1 className="mb-8 font-serif text-[clamp(26px,5vw,34px)] leading-[1.15] font-medium tracking-tight text-petrol">
        {plan.possibility.titulo}
      </h1>

      <div className="mb-12 flex flex-col gap-5">
        {REPORT_SECTIONS.map((section) => (
          <div
            key={section.key}
            className="rounded-[var(--radius-app)] border border-line bg-paper-raised p-5 shadow-[var(--shadow)]"
          >
            <div className="mb-1.5 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
              {section.label}
            </div>
            <p className="text-[14.5px] leading-[1.6] text-ink">{relatorio[section.key]}</p>
          </div>
        ))}
      </div>

      <PlanEvolucao tasks={plan.tasks} milestones={plan.milestones} returnTo={`/planos/${planId}`} />

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="mb-1 font-serif text-xl font-medium tracking-tight text-petrol">
            Plano de execução — {plan.duracaoSemanas} semanas
          </h2>
          <p className="text-[13.5px] text-ink-muted">
            Check-in toda semana. O cronograma se ajusta ao seu ritmo real — nunca ao contrário.
          </p>
        </div>
        <a
          href={`/planos/${planId}/diario`}
          className="shrink-0 text-[13.5px] font-semibold whitespace-nowrap text-petrol hover:underline"
        >
          Ver diário →
        </a>
      </div>

      {hasCheckinDue ? (
        <a
          href={`/planos/${planId}/checkin`}
          className="mb-6 block rounded-[var(--radius-app)] border border-petrol bg-gold-soft px-5 py-4 text-[14.5px] font-semibold text-petrol transition-opacity hover:opacity-90"
        >
          Fazer o check-in desta semana →
        </a>
      ) : null}

      <div className="flex flex-col gap-3">
        {plan.weeks.map((week) => {
          const done = week.status === "CONCLUIDA";
          return (
            <article
              key={week.id}
              className="rounded-[var(--radius-app)] border border-line bg-paper-raised p-4"
              style={done ? { opacity: 0.75 } : undefined}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] tracking-wide text-ink-muted uppercase">
                  Semana {week.weekNumber} {done ? "· concluída" : ""}
                </span>
                <span className="text-[12px] text-ink-muted">
                  {formatDate(week.scheduledDate, { day: "2-digit", month: "short" })}
                </span>
              </div>
              <p className="mb-2 text-[15px] font-medium text-ink">{week.meta}</p>
              <ul className="mb-2 flex list-inside list-disc flex-col gap-1 text-[13.5px] text-ink">
                {week.tasks.map((t) => (
                  <li key={t.id}>{t.texto}</li>
                ))}
              </ul>
              {week.dificuldadesAntecipadas ? (
                <p className="text-[12.5px] text-ink-muted">
                  <strong>Costuma travar em:</strong> {week.dificuldadesAntecipadas}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
