"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-active-access";
import type { CaminhoRendaStatus } from "@/generated/prisma/client";

export async function revisarNegocio(
  returnTo: string,
  id: string,
  novoStatus: CaminhoRendaStatus,
  formData: FormData,
) {
  await requireAdmin();
  const nota = String(formData.get("nota") ?? "").trim();

  await db.pequenoNegocio.update({
    where: { id },
    data: { status: novoStatus, notaRevisao: nota || null },
  });

  revalidatePath("/admin/pequenos-negocios");
  revalidatePath(returnTo);
  redirect(returnTo);
}

// Libera (ou desfaz) a visão completa deste negócio para TODAS as contas
// gratuitas, sem gastar o limite de desbloqueios de ninguém.
export async function alternarLiberadoGratuito(returnTo: string, id: string, liberar: boolean) {
  await requireAdmin();

  const negocio = await db.pequenoNegocio.update({
    where: { id },
    data: { liberadoGratuito: liberar },
    select: { codigo: true },
  });

  revalidatePath("/admin/pequenos-negocios");
  revalidatePath(returnTo);
  revalidatePath("/negocios");
  revalidatePath(`/negocios/${negocio.codigo}`);
  redirect(returnTo);
}
