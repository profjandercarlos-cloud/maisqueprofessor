"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-active-access";
import { gerarNovoLote } from "@/lib/dicas/banco";

// Aposenta uma dica (sai do sorteio; quem já a recebeu continua vendo no caderno) ou a reativa.
export async function alternarStatusDica(dicaId: string) {
  await requireAdmin();
  const dica = await db.dica.findUnique({ where: { id: dicaId }, select: { status: true } });
  if (!dica) return;
  await db.dica.update({
    where: { id: dicaId },
    data: { status: dica.status === "ATIVA" ? "APOSENTADA" : "ATIVA" },
  });
  revalidatePath("/admin/dicas");
}

// Gera um lote agora, sem esperar o gatilho automático. Respeita o teto e as travas de sempre.
export async function gerarLoteAgora() {
  await requireAdmin();
  const resultado = await gerarNovoLote();
  revalidatePath("/admin/dicas");
  const mensagem =
    resultado.status === "gerado"
      ? `Lote gerado com ${resultado.quantidade} dicas.`
      : resultado.status === "ignorado"
        ? `Nada gerado: ${resultado.motivo}.`
        : `Falhou: ${resultado.motivo}`;
  redirect(`/admin/dicas?aviso=${encodeURIComponent(mensagem)}`);
}
