"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { lerConteudo } from "@/lib/ideias/conteudo";
import { negocioDeIdeia } from "@/lib/ideias/para-negocio";
import { PLANOS_DOS_FAVORITOS_DISPONIVEIS } from "@/lib/negocios/favoritos";
import { cotaDePlanos } from "@/lib/planos/cota";

// Só 1 plano fica ativo por vez (é o que aparece no Painel). Ativar um pausa o outro.
// Sem semanas, não há mais prazo para recalibrar: o plano retoma de onde parou.
export async function activatePlan(planId: string) {
  const user = await requireActiveAccess();

  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.userId !== user.id) redirect("/planos");
  if (plan.status === "ATIVO") redirect(`/planos/${planId}`);

  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.plan.updateMany({
      where: { userId: user.id, status: "ATIVO", id: { not: planId } },
      data: { status: "PAUSADO", pausedAt: now },
    });
    await tx.plan.update({ where: { id: planId }, data: { status: "ATIVO", pausedAt: null } });
  });

  redirect(`/planos/${planId}`);
}

// Começa um plano a partir de uma ideia favoritada: a ideia vira um negócio da pessoa
// (uma vez só por favorito) e segue para o mesmo questionário curto dos negócios
// personalizados. A cota é checada de novo antes da IA, na tela final do questionário.
export async function criarPlanoDeFavorito(ideiaId: string) {
  const user = await requireActiveAccess();
  if (!PLANOS_DOS_FAVORITOS_DISPONIVEIS) redirect("/planos");

  const favorita = await db.ideiaFavorita.findUnique({
    where: { userId_ideiaId: { userId: user.id, ideiaId } },
    include: { ideia: true },
  });
  const conteudo = favorita && favorita.ideia.status === "APROVADO" ? lerConteudo(favorita.ideia.conteudo) : null;
  if (!favorita || !conteudo) redirect("/planos");

  const existente = await db.possibility.findUnique({
    where: { userId_ideiaId: { userId: user.id, ideiaId } },
    include: { plan: { select: { id: true } } },
  });
  if (existente?.plan) redirect(`/planos/${existente.plan.id}`);
  if (existente?.status === "REJEITADA") redirect("/planos");
  if (existente) redirect(`/adequacao/${existente.id}`);

  const cota = cotaDePlanos(await db.plan.count({ where: { userId: user.id } }));
  if (cota.esgotada) redirect("/planos");

  const negocio = await db.possibility.create({
    data: { ...negocioDeIdeia(conteudo), userId: user.id, ideiaId },
  });
  redirect(`/adequacao/${negocio.id}`);
}
