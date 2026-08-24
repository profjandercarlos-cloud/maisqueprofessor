import { AppHeader } from "@/components/app-header";
import { PlanMural } from "@/components/plan-mural";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { DIAGNOSTIC_STEPS, getResumeSlug } from "@/lib/diagnostico/steps";
import { LogoutButton } from "./logout-button";
import { AppNavLinks } from "@/components/app-nav-links";
import type { PlanTask } from "@/generated/prisma/client";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireActiveAccess();
  const query = await searchParams;
  const expandedTaskId = typeof query.parcial === "string" ? query.parcial : undefined;

  const [diagnostic, activePlan, dbUser] = await Promise.all([
    db.diagnostic.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.plan.findFirst({ where: { userId: user.id, status: "ATIVO" }, include: { possibility: true } }),
    db.user.findUnique({ where: { id: user.id }, select: { isAdmin: true, name: true } }),
  ]);

  let currentWeek = null as Awaited<ReturnType<typeof loadCurrentWeek>> | null;
  let poolTasks: Awaited<ReturnType<typeof loadPoolTasks>> = [];
  let upcomingPlanTasks: PlanTask[] = [];
  if (activePlan) {
    [currentWeek, poolTasks] = await Promise.all([
      loadCurrentWeek(activePlan.id),
      loadPoolTasks(activePlan.id),
    ]);
    if (currentWeek) {
      upcomingPlanTasks = await loadUpcomingPlanTasks(activePlan.id, currentWeek.weekNumber);
    }
  }

  const diagnosticCta = !diagnostic
    ? { label: "Começar diagnóstico", href: `/diagnostico/${DIAGNOSTIC_STEPS[0].slug}` }
    : diagnostic.status === "EM_ANDAMENTO"
      ? {
          label: "Continuar diagnóstico",
          href: `/diagnostico/${getResumeSlug(diagnostic.intention, diagnostic.answers as Record<string, unknown>)}`,
        }
      : { label: "Ver diagnóstico concluído", href: "/diagnostico/concluido" };

  return (
    <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="INÍCIO" />

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <span className="mb-[18px] inline-block rounded-full bg-badge-bg px-2.5 py-[5px] font-mono text-[11px] tracking-[0.12em] text-badge-text uppercase">
            {diagnostic ? "De volta" : "Bem-vindo(a) ao Mais Que Professor"}
          </span>
          <h1 className="mb-3.5 font-serif text-[clamp(28px,5vw,38px)] leading-[1.15] font-medium tracking-tight text-petrol">
            Olá, <em className="font-medium text-gold not-italic italic">{dbUser?.name ?? user.email}</em>.
          </h1>
        </div>
        <LogoutButton />
      </div>

      {activePlan && currentWeek ? (
        <>
          <a
            href={`/planos/${activePlan.id}`}
            className="mb-3 inline-block text-[13px] font-semibold text-petrol hover:underline"
          >
            {activePlan.possibility.titulo} →
          </a>
          <PlanMural
            planId={activePlan.id}
            week={currentWeek}
            weekTasks={currentWeek.tasks}
            poolTasks={poolTasks}
            upcomingPlanTasks={upcomingPlanTasks}
            horasDisponiveis={activePlan.tempoDisponivelHoras}
            expandedTaskId={expandedTaskId}
            duracaoSemanas={activePlan.duracaoSemanas}
          />
        </>
      ) : activePlan ? (
        <div className="mb-8 rounded-[var(--radius-app)] border border-line bg-paper-raised p-5 shadow-[var(--shadow)]">
          <span className="mb-1 block font-mono text-[10px] tracking-wide text-gold uppercase">
            Plano concluído
          </span>
          <p className="mb-2 font-serif text-lg font-medium text-ink">{activePlan.possibility.titulo}</p>
          <p className="text-[13.5px] text-ink-muted">
            Todas as semanas foram concluídas — bom trabalho. Veja o plano completo ou comece outro.
          </p>
          <a
            href={`/planos/${activePlan.id}`}
            className="mt-3 inline-block text-[13px] font-semibold text-petrol hover:underline"
          >
            Ver plano completo →
          </a>
        </div>
      ) : (
        <a
          href={diagnosticCta.href}
          className="mb-4 inline-block rounded-lg bg-petrol px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-petrol-soft"
        >
          {diagnosticCta.label} →
        </a>
      )}

      <AppNavLinks isAdmin={!!dbUser?.isAdmin} />
    </div>
  );
}

function loadCurrentWeek(planId: string) {
  return db.planWeek.findFirst({
    where: { planId, status: "PENDENTE", checkin: null },
    orderBy: { weekNumber: "asc" },
    include: { tasks: { orderBy: { sequencia: "asc" } } },
  });
}

function loadPoolTasks(planId: string) {
  return db.planTask.findMany({
    where: { planId, planWeekId: null },
    orderBy: { createdAt: "asc" },
  });
}

function loadUpcomingPlanTasks(planId: string, afterWeekNumber: number) {
  return db.planTask.findMany({
    where: { planId, origin: "PLANO", planWeek: { weekNumber: { gt: afterWeekNumber } } },
    orderBy: [{ planWeek: { weekNumber: "asc" } }, { sequencia: "asc" }],
  });
}
