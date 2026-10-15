"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Só aceita os tipos de link que o app realmente envia por aqui.
const TIPOS_ACEITOS: EmailOtpType[] = ["invite", "recovery"];

export async function confirmarLink(formData: FormData) {
  const tokenHash = String(formData.get("token_hash") ?? "");
  const type = String(formData.get("type") ?? "") as EmailOtpType;
  // Mesma proteção do /auth/confirm: só caminho relativo dentro do próprio site.
  const rawNext = String(formData.get("next") ?? "");
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/definir-senha";

  if (tokenHash && TIPOS_ACEITOS.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) redirect(next);
  }

  redirect("/login?error=link-invalido");
}
