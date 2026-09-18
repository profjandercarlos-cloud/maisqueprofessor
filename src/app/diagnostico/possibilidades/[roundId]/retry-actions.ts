"use server";

import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { triggerGenerationStep } from "@/lib/ai-engine/trigger-generation-step";
import { triggerMarketPresentationStep } from "@/lib/ai-engine/trigger-market-presentation-step";

const NON_TERMINAL_STATUSES = ["PENDENTE", "GERANDO", "VALIDANDO", "CORRIGINDO", "PROCESSANDO"];

// Chamado pelo polling-wait.tsx quando detecta que uma rodada ficou sem
// atualização por tempo demais (ver updatedAt em GenerationRound) — reexecutar
// uma fase que já está em andamento é seguro (o pior caso é uma chamada de
// IA duplicada e descartada, não corrupção de dado).
export async function retryGenerationStep(roundId: string): Promise<void> {
  const user = await requireActiveAccess();

  const round = await db.generationRound.findUnique({
    where: { id: roundId },
    include: { diagnostic: { select: { userId: true } } },
  });
  if (!round || round.diagnostic.userId !== user.id) return;
  if (!NON_TERMINAL_STATUSES.includes(round.status)) return;

  await triggerGenerationStep(roundId);
}

// Camada aditiva de apresentação de mercado (ver market-presentation-prompt.ts)
// — chamada pelo próprio disparo automático em run-generation-pipeline.ts,
// mas esse disparo compete pelo mesmo orçamento de tempo da fase de
// validação/correção; quando a fase é longa (ex.: mais de uma reserva
// promovida), o disparo pode nunca chegar a rodar. Esta é a retomada: a
// tela de possibilidades já prontas chama isto se alguma das 5 ainda não
// tiver a camada, o mesmo princípio de retryGenerationStep acima.
export async function retryMarketPresentation(roundId: string): Promise<void> {
  const user = await requireActiveAccess();

  const round = await db.generationRound.findUnique({
    where: { id: roundId },
    include: {
      diagnostic: { select: { userId: true } },
      possibilities: { select: { analiseMercadoAmpliada: true } },
    },
  });
  if (!round || round.diagnostic.userId !== user.id) return;
  if (round.status !== "CONCLUIDO" || round.possibilities.length !== 5) return;
  if (round.possibilities.every((p) => p.analiseMercadoAmpliada !== null)) return;

  await triggerMarketPresentationStep(roundId);
}
