"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { ANTI_PROCRASTINACAO_ITENS } from "@/lib/anti-procrastinacao/itens";

function fail(message: string): never {
  redirect(`/anti-procrastinacao?error=${encodeURIComponent(message)}`);
}

export async function salvarRespostas(planId: string, formData: FormData) {
  const user = await requireActiveAccess();

  const plan = await db.plan.findUnique({ where: { id: planId }, select: { userId: true } });
  if (!plan || plan.userId !== user.id) fail("Plano não encontrado.");

  await db.$transaction(
    ANTI_PROCRASTINACAO_ITENS.map((item) => {
      const resposta = String(formData.get(item.key) ?? "").trim();
      return db.antiProcrastinacaoResposta.upsert({
        where: { planId_itemKey: { planId, itemKey: item.key } },
        create: { planId, itemKey: item.key, resposta },
        update: { resposta },
      });
    }),
  );

  revalidatePath("/anti-procrastinacao");
  redirect("/anti-procrastinacao?salvo=1");
}
