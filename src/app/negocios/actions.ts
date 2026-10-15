"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getTipoAcesso, requireUser } from "@/lib/auth/require-active-access";
import { LIMITE_DESBLOQUEIOS_GRATUITOS } from "@/lib/negocios/visibilidade";

// Desbloqueia a visão completa de um negócio para uma conta gratuita. O
// limite é conferido AQUI (não só escondendo o botão na tela): sem isso, dava
// pra desbloquear mais do que o limite chamando a action direto.
export async function desbloquearNegocio(codigo: string) {
  const user = await requireUser();
  const destino = `/negocios/${encodeURIComponent(codigo)}`;

  const negocio = await db.pequenoNegocio.findFirst({
    where: { codigo, status: "APROVADO" },
    select: { id: true, liberadoGratuito: true },
  });
  if (!negocio) redirect("/negocios");

  // Conta paga e negócio já liberado pelo admin não gastam desbloqueio.
  const tipo = await getTipoAcesso(user.id);
  if (tipo === "pago" || negocio.liberadoGratuito) redirect(destino);

  const jaDesbloqueado = await db.negocioDesbloqueado.findUnique({
    where: { userId_negocioId: { userId: user.id, negocioId: negocio.id } },
  });
  if (jaDesbloqueado) redirect(destino);

  const usados = await db.negocioDesbloqueado.count({ where: { userId: user.id } });
  if (usados >= LIMITE_DESBLOQUEIOS_GRATUITOS) {
    redirect(`${destino}?erro=limite`);
  }

  try {
    await db.negocioDesbloqueado.create({ data: { userId: user.id, negocioId: negocio.id } });
  } catch (err) {
    // Clique duplo: a unicidade (userId, negocioId) já garante um registro só.
    console.error("desbloquearNegocio", err);
  }

  revalidatePath("/negocios");
  revalidatePath(destino);
  redirect(destino);
}
