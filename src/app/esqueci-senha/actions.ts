"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type ForgotPasswordState = { sent?: boolean; error?: string } | undefined;

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Informe seu e-mail." };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin = process.env.NEXT_PUBLIC_APP_URL || `https://${headersList.get("host")}`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/definir-senha`,
  });

  // Não revelamos se o e-mail existe ou não na base — evita enumeração de contas.
  if (error) {
    console.error("resetPasswordForEmail error", error);
  }

  return { sent: true };
}
