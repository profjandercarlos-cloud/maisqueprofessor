"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { statusDaAcao } from "@/lib/plano/acoes";

// Marca ou desmarca um item do checklist e recalcula o estado da ação (a fazer,
// em andamento ou concluída). O estado nunca é digitado: sai sempre dos itens.
// Só mexe em itens de ações de planos da própria pessoa.
export async function alternarItem(planId: string, acaoId: string, itemId: string): Promise<void> {
  const user = await requireActiveAccess();

  const item = await db.planAcaoItem.findFirst({
    where: { id: itemId, acaoId, acao: { planId, plan: { userId: user.id } } },
    select: { id: true, feito: true },
  });
  if (!item) return;

  await db.planAcaoItem.update({
    where: { id: item.id },
    data: item.feito ? { feito: false, feitoEm: null } : { feito: true, feitoEm: new Date() },
  });

  const itens = await db.planAcaoItem.findMany({ where: { acaoId }, select: { feito: true } });
  const status = statusDaAcao(itens);
  await db.planAcao.update({
    where: { id: acaoId },
    data: { status, concluidaEm: status === "CONCLUIDA" ? new Date() : null },
  });

  revalidatePath("/");
  revalidatePath("/planos");
  revalidatePath(`/planos/${planId}`);
  revalidatePath(`/planos/${planId}/acoes/${acaoId}`);
}
