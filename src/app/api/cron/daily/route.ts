import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { timingSafeStringEqual } from "@/lib/timing-safe-equal";
import { sendAccessExpiringReminder } from "@/lib/email/notifications";

const DAY_MS = 24 * 60 * 60 * 1000;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader !== null && timingSafeStringEqual(authHeader, `Bearer ${secret}`);
}

// Rotina diária. Desde out/2026 NÃO há mais check-in nem lembretes de semana: sobram
// só o bloqueio de acesso vencido e o aviso de vencimento próximo.
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = {
    accessExpiring: 0,
    accessBlocked: 0,
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

  return NextResponse.json({ ok: true, ...results });
}
