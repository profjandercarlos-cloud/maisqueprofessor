"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";

function fail(returnTo: string, message: string): never {
  redirect(`${returnTo}?error=${encodeURIComponent(message)}`);
}

async function loadOwnedMilestone(milestoneId: string, userId: string) {
  const milestone = await db.planMilestone.findUnique({
    where: { id: milestoneId },
    include: { plan: { select: { userId: true } } },
  });
  if (!milestone || milestone.plan.userId !== userId) return null;
  return milestone;
}

// Marcar/desmarcar é sempre decisão manual da pessoa — não existe detecção
// automática de "marco alcançado" a partir de tarefas concluídas, mesma
// lógica de sempre-manual usada no resto do plano.
export async function markMilestoneAchieved(returnTo: string, milestoneId: string) {
  const user = await requireActiveAccess();
  const milestone = await loadOwnedMilestone(milestoneId, user.id);
  if (!milestone) fail(returnTo, "Marco não encontrado.");

  await db.planMilestone.update({ where: { id: milestoneId }, data: { achievedAt: new Date() } });

  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function unmarkMilestoneAchieved(returnTo: string, milestoneId: string) {
  const user = await requireActiveAccess();
  const milestone = await loadOwnedMilestone(milestoneId, user.id);
  if (!milestone) fail(returnTo, "Marco não encontrado.");

  await db.planMilestone.update({ where: { id: milestoneId }, data: { achievedAt: null } });

  revalidatePath(returnTo);
  redirect(returnTo);
}
