"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { formatDiagnosticInput } from "@/lib/ai-engine/generate-possibilities";
import { generatePossibilitiesOpenAI } from "@/lib/ai-engine/generate-possibilities-openai";
import { logDebugError } from "@/lib/debug-error-log";

const MAX_ADJUSTMENT_ROUNDS = 3;

export async function submitAdjustment(roundId: string, formData: FormData) {
  const feedback = String(formData.get("feedback") ?? "").trim();
  if (!feedback) {
    redirect(`/diagnostico/possibilidades/${roundId}/ajustar?error=${encodeURIComponent("Conte o que não fez sentido no conjunto.")}`);
  }

  const user = await requireActiveAccess();

  const round = await db.generationRound.findUnique({
    where: { id: roundId },
    include: { possibilities: true, diagnostic: { include: { rounds: { include: { possibilities: true } } } } },
  });
  if (!round || round.diagnostic.userId !== user.id) redirect("/");

  const adjustmentsUsed = round.roundNumber - 1;
  if (adjustmentsUsed >= MAX_ADJUSTMENT_ROUNDS) {
    redirect(`/diagnostico/possibilidades/${roundId}`);
  }

  const rejectedTitles = round.diagnostic.rounds.flatMap((r) => r.possibilities.map((p) => p.titulo));

  let generated;
  try {
    generated = await generatePossibilitiesOpenAI({
      diagnosticInput: formatDiagnosticInput(round.diagnostic),
      feedback,
      rejectedTitles,
    });
  } catch (err) {
    // Só marca o conjunto anterior como rejeitado depois que a geração do
    // novo conjunto realmente funcionar — se falhar aqui, a pessoa não pode
    // ficar sem nenhum conjunto de possibilidades.
    console.error("Erro ao gerar novo conjunto de possibilidades", err);
    await logDebugError("ajustar:generatePossibilities", err);
    redirect(
      `/diagnostico/possibilidades/${roundId}/ajustar?error=${encodeURIComponent("Não foi possível gerar o novo conjunto agora. Tente de novo em instantes.")}`,
    );
  }

  await db.possibility.updateMany({
    where: { roundId: round.id },
    data: { status: "REJEITADA" },
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
