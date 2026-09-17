"use server";

import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { triggerGenerationStep } from "@/lib/ai-engine/trigger-generation-step";

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
