import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { applyHotmartEvent, parseHotmartPayload } from "@/lib/hotmart/process-event";
import { timingSafeStringEqual } from "@/lib/timing-safe-equal";

function isHottokValid(request: NextRequest, payload: Record<string, unknown>): boolean {
  const expected = process.env.HOTMART_HOTTOK;
  if (!expected) return false;

  const headerToken = request.headers.get("x-hotmart-hottok");
  const bodyToken = typeof payload.hottok === "string" ? payload.hottok : undefined;

  return (
    (headerToken !== null && timingSafeStringEqual(headerToken, expected)) ||
    (bodyToken !== undefined && timingSafeStringEqual(bodyToken, expected))
  );
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

  const { event, transactionId, email, name } = parseHotmartPayload(payload);

  if (!transactionId) {
    return NextResponse.json({ error: "transação ausente no payload" }, { status: 400 });
  }

  // A mesma transação (compra) gera vários eventos DIFERENTES ao longo do
  // tempo — aprovada agora, talvez cancelada/reembolsada semanas depois. A
  // chave de idempotência precisa incluir o tipo do evento, senão o segundo
  // evento de uma transação já vista é descartado como "duplicata" mesmo
  // sendo uma ação diferente (ex.: reembolso nunca revogaria o acesso,
  // porque o ID já teria sido "gasto" pelo evento de aprovação).
  const idempotencyKey = `${transactionId}:${event}`;

  // Idempotência: a Hotmart pode reenviar o mesmo evento até 5x. Tentamos
  // "reivindicar" a transação+evento criando o registro primeiro — se já
  // existir, a unique constraint falha e sabemos que já foi processado.
  try {
    await db.hotmartTransaction.create({
      data: { transactionId: idempotencyKey, eventType: event, payload: payload as Prisma.InputJsonValue },
    });
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ ok: true, idempotent: true });
    }
    throw err;
  }

  let userId: string | undefined;

  try {
    userId = await applyHotmartEvent(event, email, name);
  } catch (err) {
    console.error("Erro ao processar evento da Hotmart", event, err);
    // A transação já foi gravada (idempotência preservada); o erro de
    // negócio fica registrado nos logs para investigação manual.
  }

  if (userId) {
    await db.hotmartTransaction.update({ where: { transactionId: idempotencyKey }, data: { userId } });
  }

  return NextResponse.json({ ok: true });
}
