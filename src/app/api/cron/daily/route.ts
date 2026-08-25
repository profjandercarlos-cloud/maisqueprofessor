import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendAccessExpiringReminder,
  sendCheckinReminder,
  sendEscalationMessage,
  sendUntouchedWeekReminder,
} from "@/lib/email/notifications";

const DAY_MS = 24 * 60 * 60 * 1000;
const ESCALATION_AFTER_DAYS = 28; // 4 semanas sem check-in

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = {
    accessExpiring: 0,
    accessBlocked: 0,
    checkinReminders: 0,
    escalations: 0,
    untouchedWeekReminders: 0,
  };

  // 0) "Heartbeat" — o projeto Supabase está no plano gratuito, que pausa o
  // banco após 7 dias sem atividade. As queries abaixo já mexem no Postgres
  // todo dia, mas essa chamada específica passa pela própria API do
  // Supabase (não só pelo Postgres via pooler), removendo qualquer dúvida
  // sobre o que conta como "atividade" para o detector de inatividade deles.
  try {
    await createAdminClient().auth.admin.listUsers({ page: 1, perPage: 1 });
  } catch (err) {
    console.error("Heartbeat do Supabase falhou (não crítico)", err);
  }

  // 1) Bloqueia acesso vencido (rotina diária exigida pela especificação).
  const expired = await db.user.updateMany({
    where: { accessExpiresAt: { lt: now }, accessRevokedAt: null },
    data: { accessRevokedAt: now },
  });
  results.accessBlocked = expired.count;

  // 2) Avisos de vencimento próximo (30 e 7 dias antes).
  for (const daysAhead of [30, 7]) {
    const windowStart = new Date(now.getTime() + (daysAhead - 0.5) * DAY_MS);
    const windowEnd = new Date(now.getTime() + (daysAhead + 0.5) * DAY_MS);
    const usersExpiringSoon = await db.user.findMany({
      where: { accessExpiresAt: { gte: windowStart, lt: windowEnd }, accessRevokedAt: null },
    });
    for (const user of usersExpiringSoon) {
      if (!user.notifyEmail) continue;
      await sendAccessExpiringReminder({ to: user.email, name: user.name, daysRemaining: daysAhead });
      results.accessExpiring++;
    }
  }

  // 3) Lembretes e escalada de check-in — só planos ativos, com acesso válido.
  const activePlans = await db.plan.findMany({
    where: { status: "ATIVO", user: { accessRevokedAt: null } },
    include: {
      user: true,
      weeks: {
        where: { status: "PENDENTE" },
        orderBy: { weekNumber: "asc" },
        take: 1,
        include: { tasks: true },
      },
    },
  });

  for (const plan of activePlans) {
    const currentWeek = plan.weeks[0];
    if (!currentWeek || !plan.user.notifyEmail) continue;

    const daysOverdue = Math.floor((now.getTime() - currentWeek.scheduledDate.getTime()) / DAY_MS);
    if (daysOverdue < 0) continue; // ainda não chegou a data desta semana

    if (daysOverdue >= ESCALATION_AFTER_DAYS) {
      if ((daysOverdue - ESCALATION_AFTER_DAYS) % 7 === 0) {
        await sendEscalationMessage({
          to: plan.user.email,
          name: plan.user.name,
          planId: plan.id,
          weeksWithoutCheckin: Math.floor(daysOverdue / 7),
        });
        results.escalations++;
      }
    } else if (daysOverdue % 7 === 0) {
      await sendCheckinReminder({
        to: plan.user.email,
        name: plan.user.name,
        planId: plan.id,
        weekNumber: currentWeek.weekNumber,
      });
      results.checkinReminders++;
    } else {
      // Aviso antecipado — 3 dias antes do dia de check-in da pessoa
      // (plan.diaCheckin, não a data específica da semana, que pode ter
      // deslizado por recalibração), disparado só se ninguém mexeu em
      // nenhuma tarefa ainda. Maior risco de abandono é a pessoa chegar no
      // dia do check-in sem ter começado nada.
      const daysUntilCheckin = (plan.diaCheckin - now.getDay() + 7) % 7;
      const weekUntouched = currentWeek.tasks.every((t) => t.status === "PENDENTE");
      if (daysUntilCheckin === 3 && weekUntouched) {
        await sendUntouchedWeekReminder({
          to: plan.user.email,
          name: plan.user.name,
          planId: plan.id,
          weekNumber: currentWeek.weekNumber,
        });
        results.untouchedWeekReminders++;
      }
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
