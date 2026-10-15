"use server";

import { db } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { logDebugError } from "@/lib/debug-error-log";
import { sendBoasVindasGratuita } from "@/lib/email/notifications";

export type CadastroState = { enviado?: boolean; error?: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cadastro gratuito: cria a conta no Supabase SEM mandar o e-mail de convite
// dele (ver sendBoasVindasGratuita) e manda o nosso, com link para
// /auth/continuar. A conta nasce SEM validade — é essa a marca de "gratuita"
// (ver src/lib/auth/acesso.ts). Quando a pessoa comprar com o mesmo e-mail,
// processApprovedPurchase só preenche a validade.
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
  const { data, error } = await admin.auth.admin.generateLink({ type: "invite", email });
  const tokenHash = data?.properties?.hashed_token;

  if (error || !data?.user || !tokenHash) {
    console.error("Erro no cadastro gratuito", error);
    await logDebugError("cadastro:generateLink", error ?? new Error("sem token retornado"));
    return { error: "Não foi possível criar a conta agora. Tente de novo em instantes." };
  }

  await db.user.create({ data: { id: data.user.id, name, email, accessExpiresAt: null } });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const link = `${appUrl}/auth/continuar?token_hash=${encodeURIComponent(tokenHash)}&type=invite&next=/definir-senha`;

  try {
    await sendBoasVindasGratuita({ to: email, name, link });
  } catch (err) {
    // Sem e-mail a pessoa não teria como entrar, e uma nova tentativa cairia no
    // "já existe". Desfaz a conta para ela poder tentar de novo.
    console.error("Erro ao enviar e-mail de cadastro gratuito", err);
    await logDebugError("cadastro:sendBoasVindasGratuita", err);
    await db.user.delete({ where: { id: data.user.id } }).catch(() => {});
    await admin.auth.admin.deleteUser(data.user.id).catch(() => {});
    return { error: "Não conseguimos enviar o e-mail agora. Tente de novo em instantes." };
  }

  return { enviado: true };
}
