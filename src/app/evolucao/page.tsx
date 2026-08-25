import { AppHeader } from "@/components/app-header";
import { PlanEvolucao } from "@/components/plan-evolucao";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";

export default async function EvolucaoPage() {
  const user = await requireActiveAccess();

  const activePlan = await db.plan.findFirst({
    where: { userId: user.id, status: "ATIVO" },
    include: {
      possibility: true,
      tasks: { select: { status: true } },
      milestones: { orderBy: { sequencia: "asc" } },
    },
  });

  return (
    <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="EVOLUÇÃO" />

      <h1 className="mb-1.5 font-serif text-2xl font-medium tracking-tight text-petrol">Evolução</h1>

      {activePlan ? (
        <>
          <a
            href={`/planos/${activePlan.id}`}
            className="mb-6 inline-block text-[13px] font-semibold text-petrol hover:underline"
          >
            {activePlan.possibility.titulo} →
          </a>
          <PlanEvolucao tasks={activePlan.tasks} milestones={activePlan.milestones} returnTo="/evolucao" />
        </>
      ) : (
        <p className="mt-3 text-[14px] text-ink-muted">
          Você ainda não tem um plano ativo — a evolução aparece assim que você tiver um.{" "}
          <a href="/planos" className="font-semibold text-petrol hover:underline">
            Ver meus planos →
          </a>
        </p>
      )}
    </div>
  );
}
