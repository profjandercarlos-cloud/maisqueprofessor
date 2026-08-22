"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { generatePossibilities, formatDiagnosticInput } from "@/lib/ai-engine/generate-possibilities";

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
    generated = await generatePossibilities({
      diagnosticInput: formatDiagnosticInput(diagnostic),
    });
  } catch (err) {
    // Loga o erro real (aparece nos Runtime Logs da Vercel) em vez de deixar
    // a pessoa cair numa tela de erro genérica sem nenhuma pista do que
    // aconteceu.
    console.error("Erro ao gerar as 5 possibilidades", err);
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
