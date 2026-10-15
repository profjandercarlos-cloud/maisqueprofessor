"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-active-access";
import { listaCheia } from "@/lib/negocios/lista";

function destinoSeguro(voltarPara: string, codigo: string): string {
  // Só caminho relativo dentro do site (mesma proteção do login e do /auth/confirm).
  return voltarPara.startsWith("/") && !voltarPara.startsWith("//") ? voltarPara : `/negocios/${encodeURIComponent(codigo)}`;
}

// O limite é conferido AQUI (não só escondendo o botão): sem isso, dava para
// passar do limite chamando a action direto.
export async function adicionarNaLista(codigo: string, voltarPara: string) {
  const user = await requireUser();
  const destino = destinoSeguro(voltarPara, codigo);

  const negocio = await db.pequenoNegocio.findFirst({
    where: { codigo, status: "APROVADO", fichaGeradaEm: { not: null } },
    select: { id: true },
  });
  if (!negocio) redirect("/negocios");

  const jaEsta = await db.negocioNaLista.findUnique({
    where: { userId_negocioId: { userId: user.id, negocioId: negocio.id } },
  });
  if (jaEsta) redirect(destino);

  const qtd = await db.negocioNaLista.count({ where: { userId: user.id } });
  if (listaCheia(qtd)) redirect(`${destino}${destino.includes("?") ? "&" : "?"}erro=lista-cheia`);

  try {
    await db.negocioNaLista.create({ data: { userId: user.id, negocioId: negocio.id } });
  } catch (err) {
    // Clique duplo: a unicidade (userId, negocioId) já garante um registro só.
    console.error("adicionarNaLista", err);
  }

  revalidatePath("/negocios");
  revalidatePath("/negocios/lista");
  revalidatePath(`/negocios/${codigo}`);
  redirect(destino);
}

export async function removerDaLista(codigo: string, voltarPara: string) {
  const user = await requireUser();
  const destino = destinoSeguro(voltarPara, codigo);

  const negocio = await db.pequenoNegocio.findUnique({ where: { codigo }, select: { id: true } });
  if (negocio) {
    await db.negocioNaLista.deleteMany({ where: { userId: user.id, negocioId: negocio.id } });
  }

  revalidatePath("/negocios");
  revalidatePath("/negocios/lista");
  revalidatePath(`/negocios/${codigo}`);
  redirect(destino);
}
