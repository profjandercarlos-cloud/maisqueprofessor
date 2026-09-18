// Trabalho de fato da camada de apresentação de mercado — chamado pela rota
// /api/internal/market-presentation. Roda 1x por round, depois que ele já
// está CONCLUIDO. Best-effort: qualquer falha aqui é só logada — nunca
// re-tenta sozinho, nunca derruba nada do round em si (ver
// trigger-market-presentation-step.ts).
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { logDebugError } from "@/lib/debug-error-log";
import { formatDiagnosticInput } from "./format-diagnostic-input";
import {
  generateMarketPresentationOpenAI,
  type PossibilidadeParaApresentacao,
} from "./generate-market-presentation-openai";

export async function runMarketPresentationStep(roundId: string): Promise<void> {
  const round = await db.generationRound.findUnique({
    where: { id: roundId },
    include: { possibilities: { orderBy: { createdAt: "asc" } }, diagnostic: true },
  });
  if (!round || round.status !== "CONCLUIDO" || round.possibilities.length !== 5) return;

  // Já rodou antes (ex.: retry manual) — não gasta a chamada de novo.
  if (round.possibilities.every((p) => p.analiseMercadoAmpliada !== null)) return;

  const possibilidades: PossibilidadeParaApresentacao[] = round.possibilities.map((p, index) => ({
    ordem: index + 1,
    papel: p.papel,
    titulo: p.titulo,
    comoFunciona: p.comoFunciona,
    porQueCombinaComVoce: p.porQueCombinaComVoce,
    comoGerarReceita: p.comoGerarReceita,
    primeiraValidacao: p.primeiraValidacao,
    pontoDeAtencao: p.pontoDeAtencao,
    impressaoDigital: p.impressaoDigital,
  }));

  try {
    const result = await generateMarketPresentationOpenAI({
      diagnosticInput: formatDiagnosticInput(round.diagnostic),
      possibilidades,
    });

    await Promise.all(
      result.possibilidades.map((item) => {
        const possibility = round.possibilities[item.ordem - 1];
        if (!possibility) return Promise.resolve();
        return db.possibility.update({
          where: { id: possibility.id },
          data: { analiseMercadoAmpliada: item as unknown as Prisma.InputJsonValue },
        });
      }),
    );
  } catch (err) {
    console.error("Erro na camada de apresentação de mercado (aditiva, não bloqueante)", err);
    await logDebugError("market-presentation:generate", err);
  }
}
