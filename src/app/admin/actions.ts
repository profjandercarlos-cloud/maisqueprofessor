"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-active-access";
import {
  applyHotmartEvent,
  parseHotmartPayload,
  processApprovedPurchase,
  processRevocation,
} from "@/lib/hotmart/process-event";

function fail(returnTo: string, message: string): never {
  redirect(`${returnTo}?error=${encodeURIComponent(message)}`);
}

// Concede/renova acesso manualmente — mesma lógica do webhook de compra
// aprovada. Cobre casos como venda feita fora do fluxo padrão da Hotmart,
// cortesia, ou correção de uma compra que falhou em criar a conta sozinha.
export async function grantAccessManually(returnTo: string, formData: FormData) {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();

  if (!email) fail(returnTo, "Informe o e-mail.");

  const existing = await db.user.findUnique({ where: { email } });
  if (!existing && !name) {
    fail(returnTo, "Esse e-mail ainda não tem conta — informe o nome para criar uma nova.");
  }

  try {
    await processApprovedPurchase(email, name || email);
  } catch (err) {
    fail(returnTo, `Falha ao conceder acesso: ${err instanceof Error ? err.message : "erro desconhecido"}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");
  redirect(returnTo);
}

export async function revokeAccessManually(returnTo: string, email: string) {
  await requireAdmin();

  await processRevocation(email);

  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");
  redirect(returnTo);
}

export async function toggleAdmin(returnTo: string, userId: string, makeAdmin: boolean) {
  await requireAdmin();

  await db.user.update({ where: { id: userId }, data: { isAdmin: makeAdmin } });

  revalidatePath("/admin/usuarios");
  redirect(returnTo);
}

// Reprocessa um evento da Hotmart já recebido (payload salvo em
// HotmartTransaction) — útil quando o processamento original falhou (ex.:
// erro temporário ao criar a conta) e a compra ficou "sem efeito".
export async function reprocessTransaction(returnTo: string, hotmartTransactionRowId: string) {
  await requireAdmin();

  const row = await db.hotmartTransaction.findUnique({ where: { id: hotmartTransactionRowId } });
  if (!row) fail(returnTo, "Transação não encontrada.");

  const { event, email, name } = parseHotmartPayload(row.payload as Record<string, unknown>);

  if (!email) {
    fail(returnTo, "Esse evento não tem e-mail de comprador no payload — não dá para reprocessar.");
  }

  try {
    const userId = await applyHotmartEvent(event, email, name);
    if (userId) {
      await db.hotmartTransaction.update({ where: { id: row.id }, data: { userId } });
    }
  } catch (err) {
    fail(returnTo, `Falha ao reprocessar: ${err instanceof Error ? err.message : "erro desconhecido"}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/hotmart");
  redirect(returnTo);
}
