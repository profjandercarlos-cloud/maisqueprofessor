import { db } from "@/lib/db";

// Teto de semanas extras (além da duração original do plano) que podem ser
// criadas sob demanda. Cada semana extra concluída dispara um check-in, que
// chama a IA pra personalizar a orientação — sem teto, isso não tinha fim.
const MAX_EXTRA_WEEKS = 5;

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

  const [plan, lastWeek] = await Promise.all([
    db.plan.findUniqueOrThrow({ where: { id: planId }, select: { duracaoSemanas: true } }),
    db.planWeek.findFirst({ where: { planId }, orderBy: { weekNumber: "desc" } }),
  ]);
  if (!lastWeek) throw new Error("Plano sem nenhuma semana.");

  const extraWeeksCreated = Math.max(0, lastWeek.weekNumber - plan.duracaoSemanas);
  if (extraWeeksCreated >= MAX_EXTRA_WEEKS) {
    // Teto atingido — não cria mais nenhuma semana nova (e portanto não
    // dispara mais nenhum check-in novo pra este plano); devolve a última
    // existente, que ainda serve de destino pra puxar itens do pool.
    return lastWeek;
  }

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
