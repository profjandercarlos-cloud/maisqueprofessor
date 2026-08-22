import { db } from "@/lib/db";

// A semana "em execução" é sempre a mais antiga ainda PENDENTE. Quando não
// sobra nenhuma (a pessoa ficou pra trás e o pool ainda tem itens não
// resolvidos), uma semana extra é criada sob demanda — sem tarefa nova da
// IA, só pra dar lugar ao que precisa ser puxado do pool.
export async function getOrCreateCurrentWeek(planId: string) {
  const existing = await db.planWeek.findFirst({
    where: { planId, status: "PENDENTE" },
    orderBy: { weekNumber: "asc" },
  });
  if (existing) return existing;

  const lastWeek = await db.planWeek.findFirst({
    where: { planId },
    orderBy: { weekNumber: "desc" },
  });
  if (!lastWeek) throw new Error("Plano sem nenhuma semana.");

  const scheduledDate = new Date(lastWeek.scheduledDate);
  scheduledDate.setDate(scheduledDate.getDate() + 7);

  return db.planWeek.create({
    data: {
      planId,
      weekNumber: lastWeek.weekNumber + 1,
      meta: "Semana extra — continuação do que ficou pendente",
      dificuldadesAntecipadas: null,
      scheduledDate,
    },
  });
}
