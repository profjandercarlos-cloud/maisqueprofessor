import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { processApprovedPurchase, processRevocation } from "@/lib/hotmart/process-event";

// ATENÇÃO: o formato exato do payload e de onde vem o hottok (header
// `X-Hotmart-Hottok` vs. campo `hottok` no corpo) varia entre versões da API
// da Hotmart. Isto foi implementado seguindo o formato documentado
// publicamente (webhook v2) — precisa ser confirmado contra um evento real
// (ou uma venda de teste) antes de ir para produção. Ver Etapa 10 do checklist.
const APPROVED_EVENTS = new Set(["PURCHASE_APPROVED", "PURCHASE_COMPLETE"]);
const REVOKE_EVENTS = new Set([
  "PURCHASE_CANCELED",
  "PURCHASE_CANCELLED",
  "PURCHASE_REFUNDED",
  "PURCHASE_CHARGEBACK",
  "PURCHASE_PROTEST",
]);

function isHottokValid(request: NextRequest, payload: Record<string, unknown>): boolean {
  const expected = process.env.HOTMART_HOTTOK;
  if (!expected) return false;

  const headerToken = request.headers.get("x-hotmart-hottok");
  const bodyToken = typeof payload.hottok === "string" ? payload.hottok : undefined;

  return headerToken === expected || bodyToken === expected;
}

export async function POST(request: NextRequest) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!isHottokValid(request, payload)) {
    return NextResponse.json({ error: "hottok inválido" }, { status: 401 });
  }

  const event = String(payload.event ?? "");
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const purchase = (data.purchase ?? {}) as Record<string, unknown>;
  const buyer = (data.buyer ?? {}) as Record<string, unknown>;

  const transactionId =
    (typeof purchase.transaction === "string" && purchase.transaction) ||
    (typeof payload.id === "string" && payload.id) ||
    undefined;

  if (!transactionId) {
    return NextResponse.json({ error: "transação ausente no payload" }, { status: 400 });
  }

  // Idempotência: a Hotmart pode reenviar o mesmo evento até 5x. Tentamos
  // "reivindicar" a transação criando o registro primeiro — se já existir,
  // a unique constraint falha e sabemos que já foi processada.
  try {
    await db.hotmartTransaction.create({
      data: { transactionId, eventType: event, payload: payload as Prisma.InputJsonValue },
    });
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ ok: true, idempotent: true });
    }
    throw err;
  }

  const email = typeof buyer.email === "string" ? buyer.email.trim().toLowerCase() : undefined;
  const name = typeof buyer.name === "string" ? buyer.name : email;

  let userId: string | undefined;

  try {
    if (APPROVED_EVENTS.has(event) && email) {
      userId = await processApprovedPurchase(email, name ?? email);
    } else if (REVOKE_EVENTS.has(event) && email) {
      userId = await processRevocation(email);
    }
  } catch (err) {
    console.error("Erro ao processar evento da Hotmart", event, err);
    // A transação já foi gravada (idempotência preservada); o erro de
    // negócio fica registrado nos logs para investigação manual.
  }

  if (userId) {
    await db.hotmartTransaction.update({ where: { transactionId }, data: { userId } });
  }

  return NextResponse.json({ ok: true });
}
