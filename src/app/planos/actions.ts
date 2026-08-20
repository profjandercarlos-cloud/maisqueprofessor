"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";

export async function activatePlan(planId: string) {
  const user = await requireActiveAccess();

  const plan = await db.plan.findUnique({
    where: { id: planId },
    include: { weeks: { where: { status: "PENDENTE" } } },
  });
  if (!plan || plan.userId !== user.id) redirect("/planos");
  if (plan.status === "ATIVO") redirect(`/planos/${planId}`);

  const now = new Date();
  const wasPaused = plan.status === "PAUSADO" && plan.pausedAt;
  const pauseDurationMs = wasPaused ? now.getTime() - plan.pausedAt!.getTime() : 0;

  await db.$transaction(async (tx) => {
    // Só 1 plano ativo por vez — congela o que estava ativo antes.
    await tx.plan.updateMany({
      where: { userId: user.id, status: "ATIVO", id: { not: planId } },
      data: { status: "PAUSADO", pausedAt: now },
    });

    // Reativação considera o tempo que o plano ficou parado (recalibração
    // por tempo) — as semanas ainda pendentes deslizam pelo mesmo período.
    if (pauseDurationMs > 0) {
      for (const week of plan.weeks) {
        const newDate = new Date(week.scheduledDate.getTime() + pauseDurationMs);
        await tx.planWeek.update({ where: { id: week.id }, data: { scheduledDate: newDate } });
      }
    }

    await tx.plan.update({ where: { id: planId }, data: { status: "ATIVO", pausedAt: null } });
  });

  await db.user.update({ where: { id: user.id }, data: { checkinWeekday: plan.diaCheckin } });

  redirect(`/planos/${planId}`);
}
