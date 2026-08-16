"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import type { ObstacleCategory, Prisma } from "@/generated/prisma/client";
import { selectBaseTip } from "@/lib/orientacao/biblioteca";
import { personalizeGuidance } from "@/lib/ai-engine/personalize-guidance";

function fail(planId: string, message: string): never {
  redirect(`/planos/${planId}/checkin?error=${encodeURIComponent(message)}`);
}

export async function submitCheckin(planId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const plan = await db.plan.findUnique({
    where: { id: planId },
    include: {
      weeks: { orderBy: { weekNumber: "asc" }, include: { checkin: true } },
    },
  });
  if (!plan || plan.userId !== user.id) redirect("/");

  const currentWeek = plan.weeks.find((w) => w.status === "PENDENTE" && !w.checkin);
  if (!currentWeek) redirect(`/planos/${planId}`);

  const doneItems = String(formData.get("doneItems") ?? "").trim();
  const notDoneItems = String(formData.get("notDoneItems") ?? "").trim();
  const obstacleCategory = String(formData.get("obstacleCategory") ?? "") as ObstacleCategory;
  const freeText = String(formData.get("freeText") ?? "").trim();
  const diaryText = String(formData.get("diaryText") ?? "").trim();

  if (!doneItems) fail(planId, "Conte o que foi feito, mesmo que pouco.");
  if (!notDoneItems) fail(planId, "Conte o que não foi feito (pode ser \"nada\").");
  const validCategories = [
    "FALTA_DE_TEMPO",
    "FALTA_DE_INVESTIMENTO",
    "DIFICULDADE_TECNICA",
    "FALTA_DE_MOTIVACAO",
    "INSEGURANCA_OU_MEDO",
    "IMPREVISTO_PESSOAL_OU_EXTERNO",
    "NAO_HOUVE_OBSTACULO",
  ];
  if (!validCategories.includes(obstacleCategory)) {
    fail(planId, "Selecione a categoria do obstáculo desta semana.");
  }

  // Quantas vezes essa categoria já apareceu para essa pessoa, pra alternar
  // a dica-base da biblioteca e não repetir sempre a mesma.
  const previousOccurrences = await db.checkin.count({
    where: { planWeek: { planId: plan.id }, obstacleCategory },
  });
  const baseTipText = selectBaseTip(obstacleCategory, previousOccurrences);

  const previousCheckins = await db.checkin.findMany({
    where: { planWeek: { planId: plan.id } },
    orderBy: { createdAt: "desc" },
    take: 2,
    select: { freeText: true },
  });

  const personalizedText = await personalizeGuidance({
    baseTipText,
    currentWeekContext: freeText,
    previousWeeksContext: previousCheckins
      .map((c) => c.freeText)
      .filter((t): t is string => Boolean(t)),
  });

  const now = new Date();
  const deltaMs = now.getTime() - currentWeek.scheduledDate.getTime();
  const deltaDays = Math.round(deltaMs / (1000 * 60 * 60 * 24));

  await db.$transaction(async (tx) => {
    const checkin = await tx.checkin.create({
      data: {
        planWeekId: currentWeek.id,
        doneItems,
        notDoneItems,
        obstacleCategory,
        freeText: freeText || null,
      },
    });

    await tx.executionGuidance.create({
      data: { checkinId: checkin.id, baseTipText, personalizedText },
    });

    await tx.planWeek.update({
      where: { id: currentWeek.id },
      data: { status: "CONCLUIDA", completedAt: now },
    });

    if (diaryText) {
      await tx.journalEntry.create({
        data: { planId: plan.id, planWeekId: currentWeek.id, text: diaryText },
      });
    }

    // Recalibração — só por tempo, nunca por conteúdo: se o check-in veio
    // antes ou depois da data prevista, todo o cronograma seguinte desliza
    // pelo mesmo número de dias. O conteúdo das semanas nunca muda.
    if (deltaDays !== 0) {
      const futureWeeks = plan.weeks.filter((w) => w.weekNumber > currentWeek.weekNumber);
      for (const week of futureWeeks) {
        const newDate = new Date(week.scheduledDate);
        newDate.setDate(newDate.getDate() + deltaDays);
        await tx.planWeek.update({ where: { id: week.id }, data: { scheduledDate: newDate } });
      }
    }
  });

  redirect(`/planos/${planId}/checkin/resultado?week=${currentWeek.weekNumber}`);
}

export type { ObstacleCategory as ObstacleCategoryType };
