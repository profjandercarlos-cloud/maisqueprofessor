"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";

export async function approvePossibility(possibilityId: string) {
  const user = await requireActiveAccess();

  const possibility = await db.possibility.findUnique({
    where: { id: possibilityId },
    include: { round: { include: { diagnostic: true } } },
  });

  if (!possibility || possibility.round.diagnostic.userId !== user.id) {
    redirect("/");
  }

  // Os outros 4 do conjunto permanecem PENDENTE — ficam salvos no perfil,
  // disponíveis depois para gerar plano próprio (Etapa 9), sem virar rejeitados.
  await db.possibility.update({
    where: { id: possibilityId },
    data: { status: "APROVADA" },
  });

  redirect(`/adequacao/${possibilityId}`);
}
