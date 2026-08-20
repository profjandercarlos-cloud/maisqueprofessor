import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// Compra aprovada — cria conta nova (com e-mail de definição de senha) ou
// renova o acesso de uma conta existente. A contagem de 1 ano SEMPRE reinicia
// a partir de agora, nunca soma nem herda a data anterior (regra fechada na
// especificação).
export async function processApprovedPurchase(email: string, name: string): Promise<string> {
  const existing = await db.user.findUnique({ where: { email } });
  const accessExpiresAt = new Date(Date.now() + ONE_YEAR_MS);

  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: { accessExpiresAt, accessRevokedAt: null },
    });
    return existing.id;
  }

  const admin = createAdminClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?next=/definir-senha`;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });

  if (error || !data.user) {
    throw new Error(`Falha ao criar usuário no Supabase Auth: ${error?.message}`);
  }

  await db.user.create({
    data: {
      id: data.user.id,
      name,
      email,
      accessExpiresAt,
    },
  });

  return data.user.id;
}

// Cancelamento / reembolso / chargeback — revoga o acesso imediatamente, sem
// apagar nenhum dado (diagnóstico, planos e diário continuam salvos).
export async function processRevocation(email: string): Promise<string | undefined> {
  const existing = await db.user.findUnique({ where: { email } });
  if (!existing) return undefined;

  await db.user.update({
    where: { id: existing.id },
    data: { accessRevokedAt: new Date() },
  });

  return existing.id;
}

export const APPROVED_EVENTS = new Set(["PURCHASE_APPROVED", "PURCHASE_COMPLETE"]);
export const REVOKE_EVENTS = new Set([
  "PURCHASE_CANCELED",
  "PURCHASE_CANCELLED",
  "PURCHASE_REFUNDED",
  "PURCHASE_CHARGEBACK",
  "PURCHASE_PROTEST",
]);

// Extrai os campos que interessam do payload cru da Hotmart — usado tanto
// pelo webhook em tempo real quanto pelo reprocessamento manual no /admin
// (mesmo payload, já salvo em HotmartTransaction.payload).
export function parseHotmartPayload(payload: Record<string, unknown>): {
  event: string;
  transactionId: string | undefined;
  email: string | undefined;
  name: string | undefined;
} {
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const purchase = (data.purchase ?? {}) as Record<string, unknown>;
  const buyer = (data.buyer ?? {}) as Record<string, unknown>;

  const transactionId =
    (typeof purchase.transaction === "string" && purchase.transaction) ||
    (typeof payload.id === "string" && payload.id) ||
    undefined;

  const email = typeof buyer.email === "string" ? buyer.email.trim().toLowerCase() : undefined;
  const name = typeof buyer.name === "string" ? buyer.name : email;

  return { event: String(payload.event ?? ""), transactionId, email, name };
}

// Aplica o efeito de um evento já identificado (concede ou revoga acesso).
// Retorna o userId afetado, se algum.
export async function applyHotmartEvent(
  event: string,
  email: string | undefined,
  name: string | undefined,
): Promise<string | undefined> {
  if (APPROVED_EVENTS.has(event) && email) {
    return processApprovedPurchase(email, name ?? email);
  }
  if (REVOKE_EVENTS.has(event) && email) {
    return processRevocation(email);
  }
  return undefined;
}
