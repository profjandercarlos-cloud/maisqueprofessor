"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { getOrCreateCurrentWeek } from "@/lib/plano/current-week";

function fail(returnTo: string, message: string): never {
  redirect(`${returnTo}?error=${encodeURIComponent(message)}`);
}

async function loadOwnedTask(taskId: string, userId: string) {
  const task = await db.planTask.findUnique({
    where: { id: taskId },
    include: { plan: { select: { userId: true } } },
  });
  if (!task || task.plan.userId !== userId) return null;
  return task;
}

export async function markTaskComplete(returnTo: string, taskId: string) {
  const user = await requireActiveAccess();
  const task = await loadOwnedTask(taskId, user.id);
  if (!task) fail(returnTo, "Tarefa não encontrada.");

  await db.planTask.update({
    where: { id: taskId },
    data: { status: "COMPLETO", notaParcial: null },
  });

  revalidatePath("/");
  redirect(returnTo);
}

// Marca a tarefa como parcialmente cumprida e registra, com as palavras da
// própria pessoa, o que ainda falta — isso vira uma nova tarefa no pool
// (pendência), disponível pra ser puxada de volta quando ela quiser.
export async function markTaskPartial(returnTo: string, taskId: string, formData: FormData) {
  const user = await requireActiveAccess();
  const task = await loadOwnedTask(taskId, user.id);
  if (!task) fail(returnTo, "Tarefa não encontrada.");

  const nota = String(formData.get("nota") ?? "").trim();
  if (!nota) fail(returnTo, "Descreva o que ainda falta pra marcar como parcial.");

  const horasInformadas = Number(formData.get("horasRestantes"));
  const horasRestantes =
    Number.isFinite(horasInformadas) && horasInformadas > 0 ? horasInformadas : task.horasEstimadas;

  const maxSequencia = await db.planTask.aggregate({
    where: { planId: task.planId },
    _max: { sequencia: true },
  });

  await db.$transaction([
    db.planTask.update({
      where: { id: taskId },
      data: { status: "PARCIAL", notaParcial: nota },
    }),
    db.planTask.create({
      data: {
        planId: task.planId,
        planWeekId: null,
        texto: nota,
        horasEstimadas: horasRestantes,
        origin: "PENDENCIA",
        sequencia: (maxSequencia._max.sequencia ?? 0) + 1,
      },
    }),
  ]);

  revalidatePath("/");
  redirect(returnTo);
}

export async function createOwnTask(returnTo: string, planId: string, formData: FormData) {
  const user = await requireActiveAccess();
  const plan = await db.plan.findUnique({ where: { id: planId }, select: { userId: true } });
  if (!plan || plan.userId !== user.id) fail(returnTo, "Plano não encontrado.");

  const texto = String(formData.get("texto") ?? "").trim();
  const horas = Number(formData.get("horas"));
  if (!texto) fail(returnTo, "Descreva a tarefa.");
  if (!Number.isFinite(horas) || horas <= 0) fail(returnTo, "Informe quantas horas essa tarefa deve levar.");

  const maxSequencia = await db.planTask.aggregate({
    where: { planId },
    _max: { sequencia: true },
  });

  await db.planTask.create({
    data: {
      planId,
      planWeekId: null,
      texto,
      horasEstimadas: horas,
      origin: "PROPRIA",
      sequencia: (maxSequencia._max.sequencia ?? 0) + 1,
    },
  });

  revalidatePath("/");
  redirect(returnTo);
}

// Puxa um item do pool (pendência ou tarefa própria) pra semana em
// execução agora — cria a próxima semana sob demanda se todas as
// existentes já estiverem concluídas.
export async function pullTaskToCurrentWeek(returnTo: string, taskId: string) {
  const user = await requireActiveAccess();
  const task = await loadOwnedTask(taskId, user.id);
  if (!task) fail(returnTo, "Tarefa não encontrada.");

  const currentWeek = await getOrCreateCurrentWeek(task.planId);

  await db.planTask.update({
    where: { id: taskId },
    data: { planWeekId: currentWeek.id, status: "PENDENTE" },
  });

  revalidatePath("/");
  redirect(returnTo);
}

// Devolve um item da semana em execução de volta pro pool — pra abrir
// espaço, sempre por decisão da pessoa, nunca automático.
export async function pushTaskToPool(returnTo: string, taskId: string) {
  const user = await requireActiveAccess();
  const task = await loadOwnedTask(taskId, user.id);
  if (!task) fail(returnTo, "Tarefa não encontrada.");

  await db.planTask.update({
    where: { id: taskId },
    data: { planWeekId: null },
  });

  revalidatePath("/");
  redirect(returnTo);
}
