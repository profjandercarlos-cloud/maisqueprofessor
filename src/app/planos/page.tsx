import { AppHeader } from "@/components/app-header";
import { PapelIcon, PAPEL_LABELS } from "@/components/papel-icon";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { activatePlan } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  ATIVO: "Ativo",
  PAUSADO: "Pausado",
  CONGELADO: "Congelado",
};

export default async function PlanosPage() {
  const user = await requireActiveAccess();

  const plans = await db.plan.findMany({
    where: { userId: user.id },
    include: { possibility: true, weeks: true },
    orderBy: { createdAt: "asc" },
  });

  const planPossibilityIds = new Set(plans.map((p) => p.possibilityId));

  const availablePossibilities = await db.possibility.findMany({
    where: {
      round: { diagnostic: { userId: user.id } },
      status: { not: "REJEITADA" },
      id: { notIn: [...planPossibilityIds] },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="MEUS PLANOS" />
      <h1 className="mb-1 font-serif text-2xl font-medium tracking-tight text-petrol">
        Seus planos
      </h1>
      <p className="mb-8 text-[14.5px] text-ink-muted">
        Até 5 caminhos salvos ao mesmo tempo — só 1 fica ativo (recebendo check-in) por vez.
      </p>

      {plans.length === 0 ? (
        <p className="mb-10 text-[14.5px] text-ink-muted">Você ainda não tem nenhum plano criado.</p>
      ) : (
        <div className="mb-10 flex flex-col gap-3">
          {plans.map((plan) => {
            const completedWeeks = plan.weeks.filter((w) => w.status === "CONCLUIDA").length;
            const isActive = plan.status === "ATIVO";
            return (
              <article
                key={plan.id}
                className="rounded-[var(--radius-app)] border border-line bg-paper-raised p-4"
                style={isActive ? { borderColor: "var(--petrol)" } : undefined}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span
                    className="rounded-full px-2.5 py-0.5 font-mono text-[10px] tracking-wide uppercase"
                    style={{
                      color: isActive ? "var(--petrol)" : "var(--ink-muted)",
                      background: isActive ? "var(--gold-soft)" : "var(--line)",
                    }}
                  >
                    {STATUS_LABELS[plan.status]}
                  </span>
                  <span className="text-[12px] text-ink-muted">
                    Semana {completedWeeks}/{plan.duracaoSemanas}
                  </span>
                </div>
                <a
                  href={`/planos/${plan.id}`}
                  className="mb-3 flex items-center gap-2 font-serif text-[17px] font-medium text-ink hover:underline"
                >
                  <PapelIcon
                    papel={plan.possibility.papel}
                    className="h-[17px] w-[17px] shrink-0 text-petrol"
                  />
                  <span title={PAPEL_LABELS[plan.possibility.papel]}>{plan.possibility.titulo}</span>
                </a>
                {!isActive ? (
                  <form action={activatePlan.bind(null, plan.id)}>
                    <button
                      type="submit"
                      className="rounded-lg border border-petrol px-4 py-1.5 text-[13px] font-semibold text-petrol transition-colors hover:bg-gold-soft"
                    >
                      Tornar este o plano ativo
                    </button>
                  </form>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {availablePossibilities.length > 0 ? (
        <>
          <h2 className="mb-1 font-serif text-lg font-medium tracking-tight text-petrol">
            Outras possibilidades do seu diagnóstico
          </h2>
          <p className="mb-4 text-[13.5px] text-ink-muted">
            Ainda sem plano — dá pra transformar qualquer uma dessas num plano próprio.
          </p>
          <div className="flex flex-col gap-2.5">
            {availablePossibilities.map((p) => (
              <a
                key={p.id}
                href={`/adequacao/${p.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper-raised px-4 py-3 text-[14.5px] text-ink hover:border-petrol"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <PapelIcon papel={p.papel} className="h-[16px] w-[16px] shrink-0 text-petrol" />
                  <span className="truncate" title={PAPEL_LABELS[p.papel]}>
                    {p.titulo}
                  </span>
                </span>
                <span className="shrink-0 text-[13px] font-semibold text-petrol">Criar plano →</span>
              </a>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
