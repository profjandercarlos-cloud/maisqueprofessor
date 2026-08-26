"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import type { Prisma } from "@/generated/prisma/client";
import { getStepBySlug, getNextSlug } from "@/lib/adequacao/steps";
import { getOrCreateAdequacaoResponse } from "@/lib/adequacao/get-active-response";
import { deepSet } from "@/lib/wizard/deep-set";

export async function saveStep(possibilityId: string, slug: string, formData: FormData) {
  const step = getStepBySlug(slug);
  if (!step) redirect(`/adequacao/${possibilityId}`);

  const user = await requireActiveAccess();

  const possibility = await db.possibility.findUnique({
    where: { id: possibilityId },
    include: { round: { include: { diagnostic: true } }, plan: true },
  });
  if (!possibility || possibility.round.diagnostic.userId !== user.id) redirect("/");
  if (possibility.plan) redirect(`/planos/${possibility.plan.id}`);

  const response = await getOrCreateAdequacaoResponse(possibilityId);
  let answers = response.answers as Record<string, unknown>;
  // Sempre grava o que a pessoa digitou/selecionou nesta tentativa, mesmo
  // quando a validação falha, e só decide se avança depois de já ter
  // salvo — sem isso, uma falha de validação apagava o que a pessoa tinha
  // acabado de escrever, porque a tela seguinte recarregava a partir do
  // banco (que nunca chegou a ser atualizado).
  let errorMessage: string | null = null;

  switch (step.type) {
    case "textarea": {
      const value = String(formData.get("value") ?? "").trim();
      answers = deepSet(answers, step.path, value);
      if (!step.optional && !value) {
        errorMessage = "Este campo é obrigatório.";
      } else if (value && step.maxChars && value.length > step.maxChars) {
        errorMessage = `Escreva no máximo ${step.maxChars} caracteres.`;
      }
      break;
    }
    case "number": {
      const value = Number(formData.get("value"));
      if (Number.isNaN(value) || value < step.min || value > step.max) {
        errorMessage = `Informe um valor entre ${step.min} e ${step.max}.`;
        break;
      }
      answers = deepSet(answers, step.path, value);
      break;
    }
    case "single-select": {
      const value = String(formData.get("value") ?? "");
      if (!value) {
        errorMessage = "Selecione uma opção.";
        break;
      }
      answers = deepSet(answers, step.path, value);
      break;
    }
    case "multi-select": {
      const values = formData.getAll("value").map(String);
      answers = deepSet(answers, step.path, values);
      const min = step.minSelect ?? 0;
      const max = step.maxSelect ?? Infinity;
      if (values.length < min) {
        errorMessage = `Selecione pelo menos ${min}.`;
      } else if (values.length > max) {
        errorMessage = `Selecione no máximo ${max}.`;
      }
      break;
    }
    default:
      // intention / situation / matrix não são usados no questionário de adequação.
      break;
  }

  await db.adequacaoResponse.update({
    where: { id: response.id },
    data: { answers: answers as Prisma.InputJsonValue },
  });

  if (errorMessage) {
    redirect(`/adequacao/${possibilityId}/${slug}?error=${encodeURIComponent(errorMessage)}`);
  }

  const next = getNextSlug(slug);
  if (next) {
    redirect(`/adequacao/${possibilityId}/${next}`);
  }

  await db.adequacaoResponse.update({ where: { id: response.id }, data: { status: "CONCLUIDO" } });
  redirect(`/adequacao/${possibilityId}/concluido`);
}
