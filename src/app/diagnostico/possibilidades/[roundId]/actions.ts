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

  // Uma possibilidade REJEITADA (ex.: já tentou gerar plano e deu conflito
  // explícito) não pode ser reaprovada — sem essa checagem, reaprovar
  // resetava a proteção contra gerar o mesmo plano indefinidamente.
  if (possibility.status === "REJEITADA") {
    redirect(`/diagnostico/possibilidades/${possibility.roundId}`);
  }

  // Os outros PENDENTE do conjunto continuam PENDENTE — ficam salvos no
  // perfil, disponíveis depois para gerar plano próprio (Etapa 9).
  await db.possibility.update({
    where: { id: possibilityId },
    data: { status: "APROVADA" },
  });

  redirect(`/adequacao/${possibilityId}`);
}
