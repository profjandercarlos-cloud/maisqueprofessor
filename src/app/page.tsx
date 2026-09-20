import { AppHeader } from "@/components/app-header";
import { PlanMural } from "@/components/plan-mural";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { SHARED_STEPS, getResumeSlug } from "@/lib/diagnostico/steps";
import { LogoutButton } from "./logout-button";
import { PapelIcon } from "@/components/papel-icon";
import { Prisma } from "@/generated/prisma/client";
import type { PlanTask } from "@/generated/prisma/client";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireActiveAccess();
  const query = await searchParams;
  const expandedTaskId = typeof query.parcial === "string" ? query.parcial : undefined;

  const [diagnostic, activePlan, dbUser, pendingMissoesPossibility] = await Promise.all([
    db.diagnostic.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.plan.findFirst({ where: { userId: user.id, status: "ATIVO" }, include: { possibility: true } }),
    db.user.findUnique({ where: { id: user.id }, select: { isAdmin: true, name: true } }),
    loadPendingMissoesPossibility(user.id),
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
    ? { label: "Começar diagnóstico", href: `/diagnostico/${SHARED_STEPS[0].slug}` }
    : diagnostic.status === "EM_ANDAMENTO"
      ? {
          label: "Continuar diagnóstico",
          href: `/diagnostico/${getResumeSlug(diagnostic.intention, diagnostic.rotaProfissional, diagnostic.answers as Record<string, unknown>)}`,
        }
      : { label: "Ver diagnóstico concluído", href: "/diagnostico/concluido" };

  return (
    <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="PAINEL" />

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <span className="mb-[18px] inline-block rounded-full bg-badge-bg px-2.5 py-[5px] font-mono text-[11px] tracking-[0.12em] text-badge-text uppercase">
            {diagnostic ? "De volta" : "Bem-vindo(a) à Rota Além da Sala"}
          </span>
          <h1 className="mb-3.5 font-serif text-[clamp(28px,5vw,38px)] leading-[1.15] font-medium tracking-tight text-petrol">
            Olá, {dbUser?.name ?? user.email}.
          </h1>
        </div>
        <LogoutButton />
      </div>

      {pendingMissoesPossibility ? (
        <div className="mb-8 rounded-[var(--radius-app)] border border-gold bg-gold-soft p-5 shadow-[var(--shadow)]">
          <span className="mb-1 block font-mono text-[10px] tracking-wide text-gold uppercase">
            Missões de ativação pendentes
          </span>
          <p className="mb-2 font-serif text-lg font-medium text-ink">{pendingMissoesPossibility.titulo}</p>
          <p className="mb-3 text-[13.5px] text-ink-muted">
            Faltam respostas nas suas missões de ativação — elas calibram o seu Plano Personalizado de Transição.
          </p>
          <a
            href={`/adequacao/${pendingMissoesPossibility.id}/missoes`}
            className="inline-block rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
          >
            Continuar minhas missões →
          </a>
        </div>
      ) : null}

      {activePlan && currentWeek ? (
        <>
          <div className="mb-3 flex items-center gap-2">
            <PapelIcon papel={activePlan.possibility.papel} className="h-[15px] w-[15px] shrink-0 text-petrol" />
            <span className="font-mono text-[10px] tracking-wide text-ink-muted uppercase">
              Plano ativo
            </span>
            <a
              href={`/planos/${activePlan.id}`}
              className="text-[13px] font-semibold text-petrol hover:underline"
            >
              {activePlan.possibility.titulo} →
            </a>
          </div>
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
          <p className="mb-2 flex items-center gap-2 font-serif text-lg font-medium text-ink">
            <PapelIcon papel={activePlan.possibility.papel} className="h-[16px] w-[16px] shrink-0 text-petrol" />
            {activePlan.possibility.titulo}
          </p>
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
          className="mb-4 inline-block rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
        >
          {diagnosticCta.label} →
        </a>
      )}
    </div>
  );
}

// Possibilidade aprovada, com adequação concluída e missões já geradas, mas
// ainda faltando resposta em alguma missão ou o feedback geral — o estado
// transitório entre aprovar uma possibilidade e o Plano ser criado. Sem
// isso visível no Painel, quem sai da tela de missões no meio só acha o
// caminho de volta cavando em Meus Planos.
function loadPendingMissoesPossibility(userId: string) {
  return db.possibility.findFirst({
    where: {
      round: { diagnostic: { userId } },
      status: "APROVADA",
      plan: null,
      missoesAtivacao: { some: {} },
      OR: [{ missoesAtivacao: { some: { respondidoEm: null } } }, { feedbackMissoesAtivacao: { equals: Prisma.DbNull } }],
    },
    orderBy: { createdAt: "desc" },
  });
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
