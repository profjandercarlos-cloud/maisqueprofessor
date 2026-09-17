"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { triggerGenerationStep } from "@/lib/ai-engine/trigger-generation-step";

export async function generateForActiveDiagnostic() {
  const user = await requireActiveAccess();

  const diagnostic = await db.diagnostic.findFirst({
    where: { userId: user.id, status: "CONCLUIDO" },
    orderBy: { createdAt: "desc" },
  });
  if (!diagnostic) redirect("/");

  const roundsCount = await db.generationRound.count({ where: { diagnosticId: diagnostic.id } });

  // Cria a rodada já como PENDENTE (sem possibilidades ainda) e dispara a
  // primeira fase da fila (gerar → validar → corrigir, se preciso), cada
  // uma sua própria invocação — a pessoa nunca fica esperando uma
  // requisição HTTP que pode levar vários minutos.
  const round = await db.generationRound.create({
    data: {
      diagnosticId: diagnostic.id,
      roundNumber: roundsCount + 1,
      status: "PENDENTE",
    },
  });

  after(() => triggerGenerationStep(round.id));

  redirect(`/diagnostico/possibilidades/${round.id}`);
}
