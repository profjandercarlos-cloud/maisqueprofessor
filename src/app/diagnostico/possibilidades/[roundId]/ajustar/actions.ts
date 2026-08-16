"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { generatePossibilities, formatDiagnosticInput } from "@/lib/ai-engine/generate-possibilities";

const MAX_ADJUSTMENT_ROUNDS = 3;

export async function submitAdjustment(roundId: string, formData: FormData) {
  const feedback = String(formData.get("feedback") ?? "").trim();
  if (!feedback) {
    redirect(`/diagnostico/possibilidades/${roundId}/ajustar?error=${encodeURIComponent("Conte o que não fez sentido no conjunto.")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const round = await db.generationRound.findUnique({
    where: { id: roundId },
    include: { possibilities: true, diagnostic: { include: { rounds: { include: { possibilities: true } } } } },
  });
  if (!round || round.diagnostic.userId !== user.id) redirect("/");

  const adjustmentsUsed = round.roundNumber - 1;
  if (adjustmentsUsed >= MAX_ADJUSTMENT_ROUNDS) {
    redirect(`/diagnostico/possibilidades/${roundId}`);
  }

  await db.possibility.updateMany({
    where: { roundId: round.id },
    data: { status: "REJEITADA" },
  });

  const rejectedTitles = round.diagnostic.rounds.flatMap((r) => r.possibilities.map((p) => p.titulo));

  const generated = await generatePossibilities({
    diagnosticInput: formatDiagnosticInput(round.diagnostic),
    feedback,
    rejectedTitles,
  });

  const newRound = await db.generationRound.create({
    data: {
      diagnosticId: round.diagnosticId,
      roundNumber: round.roundNumber + 1,
      feedbackText: feedback,
      possibilities: {
        create: generated.map((p) => ({
          papel: p.papel,
          titulo: p.titulo,
          subtitulo: p.subtitulo,
          naPratica: p.naPratica,
          porQueApareceu: p.porQueApareceu,
          quemPagaria: p.quemPagaria,
          jaPossuiVsAprender: p.jaPossuiVsAprender,
          familiaValor: p.familiaValor,
        })),
      },
    },
  });

  redirect(`/diagnostico/possibilidades/${newRound.id}`);
}
