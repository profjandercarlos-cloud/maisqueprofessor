"use server";

import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { logDebugError } from "@/lib/debug-error-log";

export type CadastroState = { enviado?: boolean; error?: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cadastro gratuito: reaproveita o mesmo caminho da compra (convite do
// Supabase + /definir-senha), só que a conta nasce SEM validade — é essa a
// marca de "gratuita" (ver src/lib/auth/acesso.ts). Quando a pessoa comprar
// com o mesmo e-mail, processApprovedPurchase só preenche a validade.
export async function cadastrarGratuito(_prev: CadastroState, formData: FormData): Promise<CadastroState> {
  // Campo-isca invisível: humano não preenche. Responde como se tivesse dado certo.
  if (String(formData.get("website") ?? "").trim()) return { enviado: true };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (name.length < 2) return { error: "Informe seu nome." };
  if (!EMAIL_RE.test(email)) return { error: "Informe um e-mail válido." };

  // Não revela se o e-mail já tem conta (evita enumeração) — a mensagem de
  // sucesso já orienta quem tem conta a usar Entrar / Esqueci minha senha.
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { enviado: true };

  const admin = createAdminClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?next=/definir-senha`;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });

  if (error || !data.user) {
    console.error("Erro no cadastro gratuito", error);
    await logDebugError("cadastro:inviteUserByEmail", error ?? new Error("sem usuário retornado"));
    return { error: "Não foi possível criar a conta agora. Tente de novo em instantes." };
  }

  await db.user.create({ data: { id: data.user.id, name, email, accessExpiresAt: null } });
  return { enviado: true };
}
