"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { formatDiagnosticInput } from "@/lib/ai-engine/format-diagnostic-input";
import { generatePossibilitiesOpenAI } from "@/lib/ai-engine/generate-possibilities-openai";
import { logDebugError } from "@/lib/debug-error-log";
import type { Prisma } from "@/generated/prisma/client";

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
      notaDiversidade: generated.notaDiversidade,
      avisoEconomico: generated.avisoEconomico,
      dadosAusentesRelevantes: generated.dadosAusentesRelevantes,
      metaFinanceiraUsada: generated.metaFinanceiraUsada as unknown as Prisma.InputJsonValue,
      possibilities: {
        create: generated.possibilities.map((p) => ({
          papel: p.papel,
          titulo: p.titulo,
          subtitulo: p.subtitulo,
          horizonteEconomico: p.horizonteEconomico,
          nivelLastro: p.nivelLastro,
          destaque: p.destaque,
          comoFunciona: p.comoFunciona,
          quemPagariaEComo: p.quemPagariaEComo,
          porQueCombinaComVoce: p.porQueCombinaComVoce,
          comoSeriaRotina: p.comoSeriaRotina,
          primeiraValidacao: p.primeiraValidacao,
          caminhoEconomico: p.caminhoEconomico,
          pontoDeAtencao: p.pontoDeAtencao,
          analiseInterna: p.analiseInterna as unknown as Prisma.InputJsonValue,
          analiseConvergenciaComercial: p.analiseConvergenciaComercial as unknown as Prisma.InputJsonValue,
          mapaExecucao: p.mapaExecucao as unknown as Prisma.InputJsonValue,
        })),
      },
    },
  });

  redirect(`/diagnostico/possibilidades/${newRound.id}`);
}
