"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import type { Prisma, PossibilityRole } from "@/generated/prisma/client";

export async function submitSelecaoAjuste(roundId: string, formData: FormData) {
  const user = await requireActiveAccess();

  const round = await db.generationRound.findUnique({
    where: { id: roundId },
    include: { diagnostic: true, possibilities: { include: { plan: true } } },
  });
  if (!round || round.diagnostic.userId !== user.id) redirect("/");
  if (round.diagnostic.incrementUsedAt) redirect(`/diagnostico/possibilidades/${roundId}`);

  const travados = new Set(round.possibilities.filter((p) => p.plan).map((p) => p.papel));
  const papeisTrocar = formData
    .getAll("trocar")
    .map(String)
    .filter((papel) => round.possibilities.some((p) => p.papel === papel) && !travados.has(papel as PossibilityRole));

  if (papeisTrocar.length === 0) {
    redirect(
      `/diagnostico/possibilidades/${roundId}/ajustar?error=${encodeURIComponent("Marque pelo menos uma possibilidade para trocar.")}`,
    );
  }

  const incrementAnswers = (round.diagnostic.incrementAnswers as Record<string, unknown>) ?? {};
  await db.diagnostic.update({
    where: { id: round.diagnosticId },
    data: {
      incrementAnswers: {
        ...incrementAnswers,
        selecaoAjuste: { roundId, papeisTrocar },
      } as Prisma.InputJsonValue,
    },
  });

  redirect("/diagnostico/incremento/incremento-1");
}
