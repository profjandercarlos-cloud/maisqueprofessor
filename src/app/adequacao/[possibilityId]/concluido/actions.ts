"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import {
  type AcaoAceita,
  type DistribuicaoTempo,
  type EquilibrioAprenderExecutar,
  type EstagioInicial,
  MilestoneTipo,
  type NivelAcompanhamento,
  type OrcamentoFaixa,
  type Prisma,
  type RegraSegurancaFinanceira,
} from "@/generated/prisma/client";

const MARCO_TIPO_MAP: Record<string, MilestoneTipo> = {
  entrega_controlavel: MilestoneTipo.ENTREGA_CONTROLAVEL,
  sinal_externo: MilestoneTipo.SINAL_EXTERNO,
};
import { calcularHorasNucleoSemana, calcularHorasTotais, PLAN_DURATION_SEMANAS } from "@/lib/plano/formula";
import { generateReportAndPlanOpenAI } from "@/lib/ai-engine/generate-report-plan-openai";
import { logDebugError } from "@/lib/debug-error-log";
import { formatDiagnosticInput } from "@/lib/ai-engine/format-diagnostic-input";
import { getOrCreateAdequacaoResponse } from "@/lib/adequacao/get-active-response";
import { getResumeSlug } from "@/lib/adequacao/steps";

function fail(possibilityId: string, message: string): never {
  redirect(`/adequacao/${possibilityId}/concluido?error=${encodeURIComponent(message)}`);
}

export async function generatePlan(possibilityId: string) {
  const user = await requireActiveAccess();

  const possibility = await db.possibility.findUnique({
    where: { id: possibilityId },
    include: { round: { include: { diagnostic: true } }, plan: true },
  });
  if (!possibility || possibility.round.diagnostic.userId !== user.id) redirect("/");
  if (possibility.status === "REJEITADA") redirect("/");
  if (possibility.plan) redirect(`/planos/${possibility.plan.id}`);

  const response = await getOrCreateAdequacaoResponse(possibilityId);
  const answers = response.answers as Record<string, unknown>;
  const resumeSlug = getResumeSlug(answers);
  if (resumeSlug !== "concluido") {
    redirect(`/adequacao/${possibilityId}/${resumeSlug}`);
  }

  const existingPlanCount = await db.plan.count({ where: { userId: user.id } });
  if (existingPlanCount >= 5) {
    fail(possibilityId, "Você já tem 5 planos salvos — o máximo permitido. Remova um plano nas configurações antes de criar outro.");
  }

  const tempoDisponivelHoras = Number(answers.horasSemanaisDisponiveis);
  const estagioInicial = answers.estagioInicial as EstagioInicial;
  const distribuicaoTempo = answers.distribuicaoTempo as DistribuicaoTempo;
  const investimentoFaixa = answers.orcamentoTotal12Semanas as OrcamentoFaixa;
  const regraSegurancaFinanceira = answers.regraSegurancaFinanceira as RegraSegurancaFinanceira;
  const acoesAceitas = (answers.acoesAceitas as string[] | undefined) ?? [];
  const equilibrioAprenderExecutar = answers.equilibrioAprenderExecutar as EquilibrioAprenderExecutar;
  const acompanhamento = answers.nivelAcompanhamento as NivelAcompanhamento;
  const diaCheckin = Number(answers.diaCheckin);
  const condicaoAdicionalExecucao = typeof answers.condicaoAdicionalExecucao === "string" ? answers.condicaoAdicionalExecucao : null;

  const horasNucleoSemana = calcularHorasNucleoSemana(tempoDisponivelHoras);
  const horasTotais = calcularHorasTotais(tempoDisponivelHoras);

  let generated;
  try {
    generated = await generateReportAndPlanOpenAI({
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
      horasNucleoSemana,
      estagioInicial,
      distribuicaoTempo,
      orcamentoFaixa: investimentoFaixa,
      regraSegurancaFinanceira,
      acoesAceitas: acoesAceitas as AcaoAceita[],
      equilibrioAprenderExecutar,
      condicaoAdicionalExecucao,
    });
  } catch (err) {
    console.error("Erro ao gerar relatório e plano", err);
    await logDebugError("adequacao:generateReportAndPlan", err);
    fail(possibilityId, "Não foi possível gerar seu plano agora. Tente de novo em instantes.");
  }

  await db.adequacaoResponse.update({ where: { id: response.id }, data: { status: "CONCLUIDO" } });

  // Conflito explícito — alguma condição informada impede o teste que essa
  // possibilidade exigiria. Não cria o Plan; desfaz a aprovação (volta pra
  // PENDENTE, igual às outras 4 do conjunto) e devolve a pessoa pras 5
  // possibilidades pra escolher outra, com o motivo explicado pela IA.
  if (generated.relatorio.classificacao_encaixe === "conflito_explicito") {
    await db.possibility.update({ where: { id: possibility.id }, data: { status: "PENDENTE" } });
    redirect(
      `/diagnostico/possibilidades/${possibility.roundId}?conflito=${encodeURIComponent(generated.relatorio.explicacao_encaixe)}`,
    );
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
      horasNucleoSemana,
      investimentoFaixa,
      acompanhamento,
      diaCheckin,
      estagioInicial,
      distribuicaoTempo,
      regraSegurancaFinanceira,
      acoesAceitas: acoesAceitas as AcaoAceita[],
      equilibrioAprenderExecutar,
      condicaoAdicionalExecucao,
      classificacaoEncaixe: generated.relatorio.classificacao_encaixe,
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
      milestones: {
        create: generated.marcos.map((marco, index) => ({
          sequencia: index,
          titulo: marco.titulo,
          descricao: marco.descricao,
          tipo: MARCO_TIPO_MAP[marco.tipo],
        })),
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
      opcional: tarefa.opcional,
      sequencia: sequencia++,
    }));
  });
  await db.planTask.createMany({ data: taskRows });

  await db.user.update({ where: { id: user.id }, data: { checkinWeekday: diaCheckin } });
  await db.possibility.update({ where: { id: possibility.id }, data: { status: "APROVADA" } });

  redirect(`/planos/${plan.id}`);
}
