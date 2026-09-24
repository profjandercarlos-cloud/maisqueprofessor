"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import type { DimensaoEspecificacao, MissaoConclusao, Prisma } from "@/generated/prisma/client";

const CONCLUSAO_MAP: Record<string, MissaoConclusao> = {
  total: "TOTAL",
  parcial: "PARCIAL",
  nao: "NAO",
};

const DIMENSOES: { chave: "publico" | "problema" | "formato" | "evidencia"; enumValue: DimensaoEspecificacao }[] = [
  { chave: "publico", enumValue: "PUBLICO" },
  { chave: "problema", enumValue: "PROBLEMA" },
  { chave: "formato", enumValue: "FORMATO" },
  { chave: "evidencia", enumValue: "EVIDENCIA" },
];

function fail(possibilityId: string, message: string): never {
  redirect(`/adequacao/${possibilityId}/especificacao?error=${encodeURIComponent(message)}`);
}

export async function responderAcao(possibilityId: string, acaoId: string, formData: FormData) {
  const user = await requireActiveAccess();

  const acao = await db.acaoEspecificacao.findUnique({
    where: { id: acaoId },
    include: { possibility: { include: { round: { include: { diagnostic: true } } } } },
  });
  if (!acao || acao.possibility.round.diagnostic.userId !== user.id || acao.possibilityId !== possibilityId) {
    redirect("/");
  }

  const conclusaoRaw = String(formData.get("conseguiuConcluir") ?? "");
  const conclusao = CONCLUSAO_MAP[conclusaoRaw];
  const tempoRealRaw = formData.get("tempoRealMinutos");
  const oQueAconteceu = String(formData.get("oQueAconteceu") ?? "").trim();
  const reflexao = String(formData.get("reflexao") ?? "").trim();

  if (!conclusao || !oQueAconteceu || !reflexao) {
    fail(possibilityId, "Responda os três campos da ação antes de continuar.");
  }

  const tempoRealMinutos =
    typeof tempoRealRaw === "string" && tempoRealRaw.trim() !== "" ? Number(tempoRealRaw) : null;

  await db.acaoEspecificacao.update({
    where: { id: acaoId },
    data: {
      conseguiuConcluir: conclusao,
      tempoRealMinutos,
      oQueAconteceu,
      reflexao,
      respondidoEm: new Date(),
    },
  });

  redirect(`/adequacao/${possibilityId}/especificacao`);
}

export async function enviarFeedbackEspecificacao(possibilityId: string, formData: FormData) {
  const user = await requireActiveAccess();

  const possibility = await db.possibility.findUnique({
    where: { id: possibilityId },
    include: { round: { include: { diagnostic: true } }, acoesEspecificacao: true },
  });
  if (!possibility || possibility.round.diagnostic.userId !== user.id) redirect("/");

  const todasRespondidas = possibility.acoesEspecificacao.every((a) => a.respondidoEm !== null);
  if (!todasRespondidas || possibility.acoesEspecificacao.length === 0) {
    fail(possibilityId, "Responda todas as ações antes de enviar o feedback geral.");
  }

  const vontadeContinuar = String(formData.get("vontadeContinuar") ?? "");
  const horasReaisRaw = formData.get("horasReaisPorSemana");
  const dificuldadePrincipal = String(formData.get("dificuldadePrincipal") ?? "").trim();

  if (!["aumentou", "igual", "diminuiu"].includes(vontadeContinuar)) {
    fail(possibilityId, "Responda como sua vontade de continuar mudou depois de Sua Rota Específica.");
  }

  const horasReaisPorSemana =
    typeof horasReaisRaw === "string" && horasReaisRaw.trim() !== "" ? Number(horasReaisRaw) : null;

  // Completa o recorte especificado: dimensões já resolvidas pela própria
  // possibilidade (gravadas na geração, ver concluido/actions.ts) ficam
  // como estão; as que dependiam de uma ação real usam o "oQueAconteceu"
  // da ação correspondente. Montagem determinística — sem chamada de IA.
  const recorteParcial = (possibility.recorteEspecificado ?? {}) as Record<string, string | null>;
  const recorteCompleto: Record<string, string> = {};
  for (const { chave, enumValue } of DIMENSOES) {
    if (recorteParcial[chave]) {
      recorteCompleto[chave] = recorteParcial[chave] as string;
      continue;
    }
    const acao = possibility.acoesEspecificacao.find((a) => a.dimensao === enumValue);
    recorteCompleto[chave] = acao?.oQueAconteceu ?? "";
  }

  await db.possibility.update({
    where: { id: possibilityId },
    data: {
      recorteEspecificado: recorteCompleto as Prisma.InputJsonValue,
      feedbackEspecificacao: {
        vontadeContinuar,
        horasReaisPorSemana,
        dificuldadePrincipal: dificuldadePrincipal || null,
      } as Prisma.InputJsonValue,
    },
  });

  redirect(`/adequacao/${possibilityId}/concluido`);
}
