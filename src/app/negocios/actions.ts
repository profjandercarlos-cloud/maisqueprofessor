"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-active-access";

// Favorita ou desfavorita (um clique no coração). Devolve o estado final.
// Não redireciona: a tela atualiza no lugar, sem recarregar a página.
export async function alternarFavorito(slug: string): Promise<boolean> {
  const user = await requireUser();

  const ideia = await db.ideiaNegocio.findFirst({
    where: { slug, status: "APROVADO" },
    select: { id: true },
  });
  if (!ideia) return false;

  const chave = { userId: user.id, ideiaId: ideia.id };
  const jaFavorita = await db.ideiaFavorita.findFirst({ where: chave, select: { id: true } });

  let favorita: boolean;
  if (jaFavorita) {
    await db.ideiaFavorita.deleteMany({ where: chave });
    favorita = false;
  } else {
    try {
      await db.ideiaFavorita.create({ data: chave });
    } catch (err) {
      // Clique duplo: a unicidade (userId, ideiaId) já garante um registro só.
      console.error("alternarFavorito", err);
    }
    favorita = true;
  }

  revalidatePath("/negocios");
  revalidatePath("/negocios/favoritos");
  revalidatePath(`/negocios/${slug}`);
  return favorita;
}
