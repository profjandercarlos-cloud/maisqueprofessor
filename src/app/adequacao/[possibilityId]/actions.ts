"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import type { Prisma } from "@/generated/prisma/client";
import { calcularHorasTotais, PLAN_DURATION_SEMANAS } from "@/lib/plano/formula";
import { generateReportAndPlan } from "@/lib/ai-engine/generate-report-plan";
import { logDebugError } from "@/lib/debug-error-log";
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
  const acompanhamento = String(formData.get("acompanhamento") ?? "");
  const diaCheckin = Number(formData.get("diaCheckin"));

  if (!tempoDisponivelHoras || tempoDisponivelHoras <= 0) {
    fail(possibilityId, "Informe quantas horas por semana você tem disponível.");
  }
  if (!investimentoFaixa) fail(possibilityId, "Selecione uma faixa de investimento.");
  if (!acompanhamento) fail(possibilityId, "Selecione o nível de acompanhamento.");
  if (Number.isNaN(diaCheckin) || diaCheckin < 0 || diaCheckin > 6) {
    fail(possibilityId, "Selecione o dia do check-in.");
  }

  const horasTotais = calcularHorasTotais(tempoDisponivelHoras);

  let generated;
  try {
    generated = await generateReportAndPlan({
      diagnosticInput: formatDiagnosticInput(possibility.round.diagnostic),
      possibility: {
        titulo: possibility.titulo,
        naPratica: possibility.naPratica,
        porQueApareceu: possibility.porQueApareceu,
        quemPagaria: possibility.quemPagaria,
        jaPossuiVsAprender: possibility.jaPossuiVsAprender,
      },
      horasTotais,
      horasPorSemana: tempoDisponivelHoras,
    });
  } catch (err) {
    console.error("Erro ao gerar relatório e plano", err);
    await logDebugError("adequacao:generateReportAndPlan", err);
    fail(possibilityId, "Não foi possível gerar seu plano agora. Tente de novo em instantes.");
  }

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
      acompanhamento,
      diaCheckin,
      duracaoSemanas: PLAN_DURATION_SEMANAS,
      relatorio: generated.relatorio as Prisma.InputJsonValue,
      weeks: {
        create: generated.semanas.map((semana, index) => {
          const scheduledDate = new Date(now);
          scheduledDate.setDate(scheduledDate.getDate() + index * 7);
          return {
            weekNumber: index + 1,
            meta: semana.meta,
            dificuldadesAntecipadas: semana.dificuldades_antecipadas,
            scheduledDate,
          };
        }),
      },
    },
    include: { weeks: { orderBy: { weekNumber: "asc" } } },
  });

  // PlanTask não pode ser criado aninhado 3 níveis abaixo de Plan (o create
  // aninhado só preenche a FK do pai imediato — planWeekId — não a de Plan)
  // então as tarefas são inseridas à parte, já com os dois IDs resolvidos.
  let sequencia = 0;
  const taskRows = generated.semanas.flatMap((semana, index) => {
    const week = plan.weeks[index];
    return semana.tarefas.map((tarefa) => ({
      planId: plan.id,
      planWeekId: week.id,
      texto: tarefa.texto,
      horasEstimadas: tarefa.horas,
      sequencia: sequencia++,
    }));
  });
  await db.planTask.createMany({ data: taskRows });

  await db.user.update({ where: { id: user.id }, data: { checkinWeekday: diaCheckin } });
  await db.possibility.update({ where: { id: possibility.id }, data: { status: "APROVADA" } });

  redirect(`/planos/${plan.id}`);
}
