"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { triggerGenerationStep } from "@/lib/ai-engine/trigger-generation-step";

const MAX_ADJUSTMENT_ROUNDS = 3;

export async function submitAdjustment(roundId: string, formData: FormData) {
  const feedback = String(formData.get("feedback") ?? "").trim();
  if (!feedback) {
    redirect(`/diagnostico/possibilidades/${roundId}/ajustar?error=${encodeURIComponent("Conte o que não fez sentido no conjunto.")}`);
  }

  const user = await requireActiveAccess();

  const round = await db.generationRound.findUnique({
    where: { id: roundId },
    include: { diagnostic: true },
  });
  if (!round || round.diagnostic.userId !== user.id) redirect("/");

  const adjustmentsUsed = round.roundNumber - 1;
  if (adjustmentsUsed >= MAX_ADJUSTMENT_ROUNDS) {
    redirect(`/diagnostico/possibilidades/${roundId}`);
  }

  // O conjunto atual só é marcado REJEITADA quando o novo for aprovado
  // (dentro da fila) — se a geração falhar, a pessoa não fica sem nenhum
  // conjunto válido. rejectedTitles não precisa mais ser passado: a fase
  // PENDENTE recalcula a partir de todas as rodadas do diagnóstico.
  const newRound = await db.generationRound.create({
    data: {
      diagnosticId: round.diagnosticId,
      roundNumber: round.roundNumber + 1,
      feedbackText: feedback,
      status: "PENDENTE",
    },
  });

  after(() => triggerGenerationStep(newRound.id));

  redirect(`/diagnostico/possibilidades/${newRound.id}`);
}
