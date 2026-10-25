"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function fail(message: string): never {
  redirect(`/configuracoes?error=${encodeURIComponent(message)}`);
}

export async function updateSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Só o nome é editável: dia de check-in e canais de notificação saíram junto com o
  // check-in (as colunas continuam no banco, sem uso).
  const name = String(formData.get("name") ?? "").trim();
  if (!name) fail("O nome não pode ficar em branco.");

  await db.user.update({ where: { id: user.id }, data: { name } });

  redirect("/configuracoes?saved=1");
}

export async function deleteAccount(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser) redirect("/login");

  const confirmation = String(formData.get("confirmation") ?? "").trim().toLowerCase();
  if (confirmation !== dbUser.email.toLowerCase()) {
    redirect(`/configuracoes?deleteError=${encodeURIComponent("Digite seu e-mail exatamente como cadastrado para confirmar.")}`);
  }

  // Apaga primeiro os dados do produto (cascade cuida do resto); a conta de
  // autenticação na Supabase é removida na sequência.
  await db.user.delete({ where: { id: user.id } });

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("Falha ao apagar usuário no Supabase Auth (dados do produto já foram removidos):", error);
  }

  await supabase.auth.signOut();
  redirect("/conta-excluida");
}
