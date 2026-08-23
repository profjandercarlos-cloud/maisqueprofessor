"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { deepGet, deepSet } from "@/lib/diagnostico/deep-set";
import {
  INCREMENT_STEPS,
  getIncrementNextSlug,
  getIncrementStepBySlug,
} from "@/lib/diagnostico/increment-steps";
import { generatePossibilities, formatDiagnosticInput } from "@/lib/ai-engine/generate-possibilities";
import { logDebugError } from "@/lib/debug-error-log";
import type { Prisma } from "@/generated/prisma/client";

export async function saveIncrementStep(slug: string, formData: FormData) {
  const step = getIncrementStepBySlug(slug);
  if (!step || step.type !== "textarea") redirect("/diagnostico/incremento/incremento-1");

  const user = await requireActiveAccess();

  const diagnostic = await db.diagnostic.findFirst({
    where: { userId: user.id, status: "CONCLUIDO" },
    orderBy: { createdAt: "desc" },
    include: { rounds: { include: { possibilities: true } } },
  });
  if (!diagnostic) redirect("/");

  const value = String(formData.get("value") ?? "").trim();
  if (!value) {
    redirect(`/diagnostico/incremento/${slug}?error=${encodeURIComponent("Este campo é obrigatório.")}`);
  }

  const incrementAnswers = deepSet(
    diagnostic.incrementAnswers as Record<string, unknown>,
    step.path,
    value,
  );

  await db.diagnostic.update({
    where: { id: diagnostic.id },
    data: { incrementAnswers: incrementAnswers as Prisma.InputJsonValue },
  });

  const next = getIncrementNextSlug(slug);
  if (next) {
    redirect(`/diagnostico/incremento/${next}`);
  }

  // Última pergunta do incremento — dispara a regeneração final (rodada 5),
  // com diagnóstico original + incremento + histórico completo de rejeições.
  const updatedAnswers = incrementAnswers;
  const incrementText = INCREMENT_STEPS.map((s) => {
    const answer = deepGet(updatedAnswers, s.path);
    return `${s.question} ${typeof answer === "string" && answer ? answer : "não informado"}`;
  }).join("\n");

  const baseInput = formatDiagnosticInput(diagnostic);
  const diagnosticInput = `${baseInput}\n\nINCREMENTO DE DIAGNÓSTICO (perguntas adicionais, após 3 rodadas sem aprovação)\n${incrementText}`;

  const rejectedTitles = diagnostic.rounds.flatMap((r) => r.possibilities.map((p) => p.titulo));
  const roundsCount = diagnostic.rounds.length;

  let generated;
  try {
    generated = await generatePossibilities({ diagnosticInput, rejectedTitles });
  } catch (err) {
    console.error("Erro ao gerar possibilidades (incremento)", err);
    await logDebugError("incremento:generatePossibilities", err);
    redirect(
      `/diagnostico/incremento/${slug}?error=${encodeURIComponent("Não foi possível gerar o novo conjunto agora. Tente de novo em instantes.")}`,
    );
  }

  const newRound = await db.generationRound.create({
    data: {
      diagnosticId: diagnostic.id,
      roundNumber: roundsCount + 1,
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
