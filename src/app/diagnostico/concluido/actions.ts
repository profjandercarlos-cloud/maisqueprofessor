"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { formatDiagnosticInput } from "@/lib/ai-engine/generate-possibilities";
import { generatePossibilitiesOpenAI } from "@/lib/ai-engine/generate-possibilities-openai";
import { logDebugError } from "@/lib/debug-error-log";

export async function generateForActiveDiagnostic() {
  const user = await requireActiveAccess();

  const diagnostic = await db.diagnostic.findFirst({
    where: { userId: user.id, status: "CONCLUIDO" },
    orderBy: { createdAt: "desc" },
  });
  if (!diagnostic) redirect("/");

  const roundsCount = await db.generationRound.count({ where: { diagnosticId: diagnostic.id } });

  let generated;
  try {
    // TESTE — trocado de generatePossibilities (Anthropic) pra
    // generatePossibilitiesOpenAI: a versão Anthropic estava estourando o
    // limite de 60s da Vercel Hobby de forma inconsistente (15s a 90s);
    // gpt-5.6-terra ficou estável em ~30s em testes repetidos.
    generated = await generatePossibilitiesOpenAI({
      diagnosticInput: formatDiagnosticInput(diagnostic),
    });
  } catch (err) {
    // Loga o erro real (aparece nos Runtime Logs da Vercel) em vez de deixar
    // a pessoa cair numa tela de erro genérica sem nenhuma pista do que
    // aconteceu.
    console.error("Erro ao gerar as 5 possibilidades", err);
    await logDebugError("diagnostico/concluido:generatePossibilities", err);
    redirect(
      `/diagnostico/concluido?error=${encodeURIComponent("Não foi possível gerar suas possibilidades agora. Tente de novo em instantes.")}`,
    );
  }

  const round = await db.generationRound.create({
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

  redirect(`/diagnostico/possibilidades/${round.id}`);
}
