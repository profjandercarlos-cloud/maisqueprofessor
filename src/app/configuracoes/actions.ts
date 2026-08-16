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

  const name = String(formData.get("name") ?? "").trim();
  const checkinWeekday = Number(formData.get("checkinWeekday"));
  const notifyEmail = formData.get("notifyEmail") === "on";
  const notifyPush = formData.get("notifyPush") === "on";

  if (!name) fail("O nome não pode ficar em branco.");
  if (Number.isNaN(checkinWeekday) || checkinWeekday < 0 || checkinWeekday > 6) {
    fail("Selecione um dia da semana válido.");
  }
  if (!notifyEmail && !notifyPush) {
    fail("Pelo menos um canal de notificação precisa ficar ativo.");
  }

  await db.user.update({
    where: { id: user.id },
    data: { name, checkinWeekday, notifyEmail, notifyPush },
  });

  // Mantém o plano ativo em sincronia com o dia de check-in global.
  await db.plan.updateMany({
    where: { userId: user.id, status: "ATIVO" },
    data: { diaCheckin: checkinWeekday },
  });

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
