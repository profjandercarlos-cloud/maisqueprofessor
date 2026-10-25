"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";

// Só 1 plano fica ativo por vez (é o que aparece no Painel). Ativar um pausa o outro.
// Sem semanas, não há mais prazo para recalibrar: o plano retoma de onde parou.
export async function activatePlan(planId: string) {
  const user = await requireActiveAccess();

  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.userId !== user.id) redirect("/planos");
  if (plan.status === "ATIVO") redirect(`/planos/${planId}`);

  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.plan.updateMany({
      where: { userId: user.id, status: "ATIVO", id: { not: planId } },
      data: { status: "PAUSADO", pausedAt: now },
    });
    await tx.plan.update({ where: { id: planId }, data: { status: "ATIVO", pausedAt: null } });
  });

  redirect(`/planos/${planId}`);
}
