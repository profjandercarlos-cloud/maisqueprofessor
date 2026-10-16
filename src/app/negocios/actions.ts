"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-active-access";

// Favorita ou desfavorita (um clique no coração). Devolve o estado final.
// Não redireciona: a tela atualiza no lugar, sem recarregar a página.
export async function alternarFavorito(codigo: string): Promise<boolean> {
  const user = await requireUser();

  const negocio = await db.pequenoNegocio.findFirst({
    where: { codigo, status: "APROVADO", fichaGeradaEm: { not: null } },
    select: { id: true },
  });
  if (!negocio) return false;

  const chave = { userId: user.id, negocioId: negocio.id };
  const jaFavorito = await db.negocioNaLista.findFirst({ where: chave, select: { id: true } });

  let favorito: boolean;
  if (jaFavorito) {
    await db.negocioNaLista.deleteMany({ where: chave });
    favorito = false;
  } else {
    try {
      await db.negocioNaLista.create({ data: chave });
    } catch (err) {
      // Clique duplo: a unicidade (userId, negocioId) já garante um registro só.
      console.error("alternarFavorito", err);
    }
    favorito = true;
  }

  revalidatePath("/negocios");
  revalidatePath("/negocios/favoritos");
  revalidatePath(`/negocios/${codigo}`);
  return favorito;
}
