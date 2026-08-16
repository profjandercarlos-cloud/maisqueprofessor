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
