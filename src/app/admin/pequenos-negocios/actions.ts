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
