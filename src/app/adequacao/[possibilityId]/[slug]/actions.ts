"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import type { Prisma } from "@/generated/prisma/client";
import { getStepBySlug, getNextSlug } from "@/lib/adequacao/steps";
import { getOrCreateAdequacaoResponse } from "@/lib/adequacao/get-active-response";
import { deepSet } from "@/lib/wizard/deep-set";

function failWith(possibilityId: string, slug: string, message: string): never {
  redirect(`/adequacao/${possibilityId}/${slug}?error=${encodeURIComponent(message)}`);
}

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
  const currentAnswers = response.answers as Record<string, unknown>;
  let answers = currentAnswers;

  switch (step.type) {
    case "textarea": {
      const value = String(formData.get("value") ?? "").trim();
      if (!step.optional && !value) {
        failWith(possibilityId, slug, "Este campo é obrigatório.");
      }
      if (value && step.maxChars && value.length > step.maxChars) {
        failWith(possibilityId, slug, `Escreva no máximo ${step.maxChars} caracteres.`);
      }
      answers = deepSet(answers, step.path, value);
      break;
    }
    case "number": {
      const value = Number(formData.get("value"));
      if (Number.isNaN(value) || value < step.min || value > step.max) {
        failWith(possibilityId, slug, `Informe um valor entre ${step.min} e ${step.max}.`);
      }
      answers = deepSet(answers, step.path, value);
      break;
    }
    case "single-select": {
      const value = String(formData.get("value") ?? "");
      if (!value) failWith(possibilityId, slug, "Selecione uma opção.");
      answers = deepSet(answers, step.path, value);
      break;
    }
    case "multi-select": {
      const values = formData.getAll("value").map(String);
      const min = step.minSelect ?? 0;
      const max = step.maxSelect ?? Infinity;
      if (values.length < min) failWith(possibilityId, slug, `Selecione pelo menos ${min}.`);
      if (values.length > max) failWith(possibilityId, slug, `Selecione no máximo ${max}.`);
      answers = deepSet(answers, step.path, values);
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

  const next = getNextSlug(slug);
  if (next) {
    redirect(`/adequacao/${possibilityId}/${next}`);
  }

  await db.adequacaoResponse.update({ where: { id: response.id }, data: { status: "CONCLUIDO" } });
  redirect(`/adequacao/${possibilityId}/concluido`);
}
