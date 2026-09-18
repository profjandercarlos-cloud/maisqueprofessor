"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import type { MissaoConclusao, Prisma } from "@/generated/prisma/client";

const CONCLUSAO_MAP: Record<string, MissaoConclusao> = {
  total: "TOTAL",
  parcial: "PARCIAL",
  nao: "NAO",
};

function fail(possibilityId: string, message: string): never {
  redirect(`/adequacao/${possibilityId}/missoes?error=${encodeURIComponent(message)}`);
}

export async function responderMissao(possibilityId: string, missaoId: string, formData: FormData) {
  const user = await requireActiveAccess();

  const missao = await db.missaoAtivacao.findUnique({
    where: { id: missaoId },
    include: { possibility: { include: { round: { include: { diagnostic: true } } } } },
  });
  if (!missao || missao.possibility.round.diagnostic.userId !== user.id || missao.possibilityId !== possibilityId) {
    redirect("/");
  }

  const conclusaoRaw = String(formData.get("conseguiuConcluir") ?? "");
  const conclusao = CONCLUSAO_MAP[conclusaoRaw];
  const tempoRealRaw = formData.get("tempoRealMinutos");
  const oQueAconteceu = String(formData.get("oQueAconteceu") ?? "").trim();
  const reflexao = String(formData.get("reflexao") ?? "").trim();

  if (!conclusao || !oQueAconteceu || !reflexao) {
    fail(possibilityId, "Responda os três campos da missão antes de continuar.");
  }

  const tempoRealMinutos =
    typeof tempoRealRaw === "string" && tempoRealRaw.trim() !== "" ? Number(tempoRealRaw) : null;

  await db.missaoAtivacao.update({
    where: { id: missaoId },
    data: {
      conseguiuConcluir: conclusao,
      tempoRealMinutos,
      oQueAconteceu,
      reflexao,
      respondidoEm: new Date(),
    },
  });

  redirect(`/adequacao/${possibilityId}/missoes`);
}

export async function enviarFeedbackMissoes(possibilityId: string, formData: FormData) {
  const user = await requireActiveAccess();

  const possibility = await db.possibility.findUnique({
    where: { id: possibilityId },
    include: { round: { include: { diagnostic: true } }, missoesAtivacao: true },
  });
  if (!possibility || possibility.round.diagnostic.userId !== user.id) redirect("/");

  const todasRespondidas = possibility.missoesAtivacao.every((m) => m.respondidoEm !== null);
  if (!todasRespondidas || possibility.missoesAtivacao.length !== 3) {
    fail(possibilityId, "Responda as 3 missões antes de enviar o feedback geral.");
  }

  const vontadeContinuar = String(formData.get("vontadeContinuar") ?? "");
  const horasReaisRaw = formData.get("horasReaisPorSemana");
  const dificuldadePrincipal = String(formData.get("dificuldadePrincipal") ?? "").trim();

  if (!["aumentou", "igual", "diminuiu"].includes(vontadeContinuar)) {
    fail(possibilityId, "Responda como sua vontade de continuar mudou depois das missões.");
  }

  const horasReaisPorSemana =
    typeof horasReaisRaw === "string" && horasReaisRaw.trim() !== "" ? Number(horasReaisRaw) : null;

  await db.possibility.update({
    where: { id: possibilityId },
    data: {
      feedbackMissoesAtivacao: {
        vontadeContinuar,
        horasReaisPorSemana,
        dificuldadePrincipal: dificuldadePrincipal || null,
      } as Prisma.InputJsonValue,
    },
  });

  redirect(`/adequacao/${possibilityId}/concluido`);
}
