"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import type { Prisma, Profundidade } from "@/generated/prisma/client";
import { calcularDuracaoSemanas, PROFUNDIDADE_CONFIG } from "@/lib/plano/formula";
import { generateReportAndPlan } from "@/lib/ai-engine/generate-report-plan";
import { formatDiagnosticInput } from "@/lib/ai-engine/format-diagnostic-input";

function fail(possibilityId: string, message: string): never {
  redirect(`/adequacao/${possibilityId}?error=${encodeURIComponent(message)}`);
}

export async function submitAdequacao(possibilityId: string, formData: FormData) {
  const user = await requireActiveAccess();

  const possibility = await db.possibility.findUnique({
    where: { id: possibilityId },
    include: { round: { include: { diagnostic: true } }, plan: true },
  });
  if (!possibility || possibility.round.diagnostic.userId !== user.id) redirect("/");
  if (possibility.status === "REJEITADA") redirect("/");
  if (possibility.plan) redirect(`/planos/${possibility.plan.id}`);

  const existingPlanCount = await db.plan.count({ where: { userId: user.id } });
  if (existingPlanCount >= 5) {
    fail(possibilityId, "Você já tem 5 planos salvos — o máximo permitido. Remova um plano nas configurações antes de criar outro.");
  }

  const tempoDisponivelHoras = Number(formData.get("tempoDisponivelHoras"));
  const investimentoFaixa = String(formData.get("investimentoFaixa") ?? "");
  const profundidade = String(formData.get("profundidade") ?? "") as Profundidade;
  const acompanhamento = String(formData.get("acompanhamento") ?? "");
  const diaCheckin = Number(formData.get("diaCheckin"));

  if (!tempoDisponivelHoras || tempoDisponivelHoras <= 0) {
    fail(possibilityId, "Informe quantas horas por semana você tem disponível.");
  }
  if (!investimentoFaixa) fail(possibilityId, "Selecione uma faixa de investimento.");
  if (!PROFUNDIDADE_CONFIG[profundidade]) fail(possibilityId, "Selecione a profundidade desejada.");
  if (!acompanhamento) fail(possibilityId, "Selecione o nível de acompanhamento.");
  if (Number.isNaN(diaCheckin) || diaCheckin < 0 || diaCheckin > 6) {
    fail(possibilityId, "Selecione o dia do check-in.");
  }

  const config = PROFUNDIDADE_CONFIG[profundidade];
  const duracaoSemanas = calcularDuracaoSemanas(profundidade, tempoDisponivelHoras);

  const generated = await generateReportAndPlan({
    diagnosticInput: formatDiagnosticInput(possibility.round.diagnostic),
    possibility: {
      titulo: possibility.titulo,
      naPratica: possibility.naPratica,
      porQueApareceu: possibility.porQueApareceu,
      quemPagaria: possibility.quemPagaria,
      jaPossuiVsAprender: possibility.jaPossuiVsAprender,
    },
    duracaoSemanas,
    minTarefas: config.minTarefas,
    maxTarefas: config.maxTarefas,
    horasPorSemana: tempoDisponivelHoras,
  });

  // Só 1 plano ativo por vez (Etapa 9) — pausa qualquer outro antes de ativar este.
  await db.plan.updateMany({
    where: { userId: user.id, status: "ATIVO" },
    data: { status: "PAUSADO", pausedAt: new Date() },
  });

  const now = new Date();

  const plan = await db.plan.create({
    data: {
      userId: user.id,
      possibilityId: possibility.id,
      tempoDisponivelHoras,
      investimentoFaixa,
      profundidade,
      acompanhamento,
      diaCheckin,
      duracaoSemanas,
      relatorio: generated.relatorio as Prisma.InputJsonValue,
      weeks: {
        create: generated.semanas.map((semana, index) => {
          const scheduledDate = new Date(now);
          scheduledDate.setDate(scheduledDate.getDate() + index * 7);
          return {
            weekNumber: index + 1,
            meta: semana.meta,
            tasks: {
              tarefas: semana.tarefas,
              dificuldadesAntecipadas: semana.dificuldades_antecipadas,
            } as Prisma.InputJsonValue,
            scheduledDate,
          };
        }),
      },
    },
  });

  await db.user.update({ where: { id: user.id }, data: { checkinWeekday: diaCheckin } });
  await db.possibility.update({ where: { id: possibility.id }, data: { status: "APROVADA" } });

  redirect(`/planos/${plan.id}`);
}
