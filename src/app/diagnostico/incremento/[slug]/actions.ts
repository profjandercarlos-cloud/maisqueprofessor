"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { deepSet } from "@/lib/wizard/deep-set";
import { otherDetailPath } from "@/lib/wizard/step-types";
import { getIncrementNextSlug, getIncrementStepBySlug, getSelecaoAjuste } from "@/lib/diagnostico/increment-steps";
import { triggerGenerationStep } from "@/lib/ai-engine/trigger-generation-step";
import { startSelectiveAdjustment } from "@/lib/ai-engine/run-generation-pipeline";
import type { Prisma } from "@/generated/prisma/client";

export async function saveIncrementStep(slug: string, formData: FormData) {
  const step = getIncrementStepBySlug(slug);
  if (!step) redirect("/diagnostico/incremento/incremento-1");

  const user = await requireActiveAccess();

  const diagnostic = await db.diagnostic.findFirst({
    where: { userId: user.id, status: "CONCLUIDO" },
    orderBy: { createdAt: "desc" },
    include: { rounds: true },
  });
  if (!diagnostic) redirect("/");
  // Mesma checagem do page.tsx, repetida aqui porque a action pode ser
  // chamada diretamente — só uma execução do incremento por diagnóstico.
  if (diagnostic.incrementUsedAt) redirect("/");

  let answers = diagnostic.incrementAnswers as Record<string, unknown>;
  let errorMessage: string | null = null;

  switch (step.type) {
    case "textarea": {
      const value = String(formData.get("value") ?? "").trim();
      answers = deepSet(answers, step.path, value);
      if (!value) errorMessage = "Este campo é obrigatório.";
      break;
    }
    case "single-select": {
      const path = step.path;
      const allowOther = step.allowOther;
      const value = String(formData.get("value") ?? "");
      if (allowOther) {
        const detail = String(formData.get("outro_detalhe") ?? "").trim();
        answers = deepSet(answers, otherDetailPath(path), detail);
      }
      answers = deepSet(answers, path, value);
      if (!value) errorMessage = "Selecione uma opção.";
      break;
    }
    case "multi-select": {
      const path = step.path;
      const allowOther = step.allowOther;
      const values = formData.getAll("value").map(String);
      answers = deepSet(answers, path, values);
      if (allowOther) {
        const detail = String(formData.get("outro_detalhe") ?? "").trim();
        answers = deepSet(answers, otherDetailPath(path), detail);
      }
      const min = step.minSelect ?? 0;
      const max = step.maxSelect ?? Infinity;
      if (values.length < min) errorMessage = `Selecione pelo menos ${min}.`;
      else if (values.length > max) errorMessage = `Selecione no máximo ${max}.`;
      break;
    }
  }

  await db.diagnostic.update({
    where: { id: diagnostic.id },
    data: { incrementAnswers: answers as Prisma.InputJsonValue },
  });

  if (errorMessage) {
    redirect(`/diagnostico/incremento/${slug}?error=${encodeURIComponent(errorMessage)}`);
  }

  const next = getIncrementNextSlug(slug);
  if (next) {
    redirect(`/diagnostico/incremento/${next}`);
  }

  // Última pergunta do incremento — dispara a regeneração final. A fase
  // PENDENTE da fila (run-generation-pipeline.ts) recalcula sozinha o texto
  // do incremento a partir de diagnostic.incrementAnswers (já salvo acima)
  // e o histórico de títulos rejeitados — não precisa receber nada disso
  // aqui, já que ela só recebe o roundId.
  const roundsCount = diagnostic.rounds.length;

  // Marca como usado antes de disparar a geração, pra nunca deixar essa
  // etapa disponível de novo, mesmo que a geração em segundo plano falhe.
  await db.diagnostic.update({ where: { id: diagnostic.id }, data: { incrementUsedAt: new Date() } });

  // Ajuste seletivo (2026-09): se a pessoa veio da tela de seleção (marcou
  // manter algumas possibilidades e trocar só outras), reaproveita a MESMA
  // rodada em vez de criar uma nova — startSelectiveAdjustment garante que
  // as mantidas nunca são tocadas. Sem seleção (ou trocando todas, sem
  // nenhuma mantida), é a regeneração completa de sempre: rodada nova,
  // macro nicho recalculado do zero.
  const selecao = getSelecaoAjuste(diagnostic.incrementAnswers);
  if (selecao) {
    after(() => startSelectiveAdjustment(selecao.roundId, selecao.papeisTrocar));
    redirect(`/diagnostico/possibilidades/${selecao.roundId}`);
  }

  const newRound = await db.generationRound.create({
    data: {
      diagnosticId: diagnostic.id,
      roundNumber: roundsCount + 1,
      status: "PENDENTE",
    },
  });

  after(() => triggerGenerationStep(newRound.id));

  redirect(`/diagnostico/possibilidades/${newRound.id}`);
}
