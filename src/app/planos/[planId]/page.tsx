import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { formatDate } from "@/lib/format-date";
import { REPORT_SECTIONS, type Relatorio } from "@/lib/plano/relatorio";

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

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="mb-1 font-serif text-xl font-medium tracking-tight text-petrol">
            Plano Personalizado de Transição — {plan.duracaoSemanas} semanas
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

      <div className="flex flex-col gap-4">
        {plan.weeks.map((week) => {
          const done = week.status === "CONCLUIDA";
          return (
            <article
              key={week.id}
              className="overflow-hidden rounded-[var(--radius-app)] border border-line bg-paper-raised shadow-[var(--shadow)]"
              style={done ? { opacity: 0.7 } : undefined}
            >
              <div className="flex items-center justify-between gap-3 border-b border-line bg-paper px-4 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-petrol font-mono text-[11px] font-bold text-paper">
                    {week.weekNumber}
                  </span>
                  <span className="font-mono text-[10.5px] tracking-[0.08em] text-ink-muted uppercase">
                    {done ? "Concluída" : "Semana"}
                  </span>
                </div>
                <span className="text-[12px] text-ink-muted">
                  {formatDate(week.scheduledDate, { day: "2-digit", month: "short" })}
                </span>
              </div>

              <div className="p-4">
                <p className="mb-3.5 font-serif text-[16px] leading-snug font-medium text-ink">
                  {week.meta}
                </p>

                <ul className="mb-3.5 flex flex-col gap-2">
                  {week.tasks.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-start gap-2.5 rounded-lg bg-paper px-3.5 py-2.5"
                    >
                      <span className="mt-[5px] h-[7px] w-[7px] shrink-0 rounded-full bg-petrol" />
                      <span className="flex-1 text-[13.5px] leading-[1.5] text-ink">{t.texto}</span>
                      <span className="mt-px shrink-0 text-[11.5px] whitespace-nowrap text-ink-muted">
                        {t.horasEstimadas}h
                      </span>
                      {t.opcional ? (
                        <span className="mt-px shrink-0 rounded-full px-2 py-0.5 font-mono text-[9.5px] tracking-wide text-gold uppercase">
                          Opcional
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>

                {week.dificuldadesAntecipadas ? (
                  <div className="flex items-start gap-2.5 rounded-lg border border-gold-soft bg-gold-soft px-3.5 py-3">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="mt-0.5 shrink-0"
                    >
                      <circle cx="8" cy="8" r="7" stroke="var(--gold)" strokeWidth="1.4" />
                      <path d="M8 7v4.5M8 4.8v.1" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                    <div>
                      <p className="mb-0.5 font-mono text-[10px] tracking-[0.06em] text-gold uppercase">
                        Ponto de atenção
                      </p>
                      <p className="text-[13px] leading-[1.5] text-ink">{week.dificuldadesAntecipadas}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
