"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import type { Intention, Prisma } from "@/generated/prisma/client";
import { getStepBySlug, getNextSlug } from "@/lib/diagnostico/steps";
import { getOrCreateActiveDiagnostic } from "@/lib/diagnostico/get-active-diagnostic";
import { deepSet } from "@/lib/diagnostico/deep-set";

function failWith(slug: string, message: string): never {
  redirect(`/diagnostico/${slug}?error=${encodeURIComponent(message)}`);
}

export async function saveStep(slug: string, formData: FormData) {
  const step = getStepBySlug(slug);
  if (!step) redirect("/diagnostico/intencao");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const diagnostic = await getOrCreateActiveDiagnostic(user.id);
  const currentAnswers = diagnostic.answers as Record<string, unknown>;

  let intention: Intention | undefined;
  let answers: Record<string, unknown> | undefined;

  switch (step.type) {
    case "intention": {
      const value = String(formData.get("value") ?? "");
      if (!["SAIR", "COMPLEMENTAR", "NAO_SEI"].includes(value)) {
        failWith(slug, "Selecione uma opção.");
      }
      intention = value as Intention;
      break;
    }
    case "textarea": {
      const value = String(formData.get("value") ?? "").trim();
      if (!step.optional && !value) {
        failWith(slug, "Este campo é obrigatório.");
      }
      answers = deepSet(currentAnswers, step.path, value);
      break;
    }
    case "single-select": {
      const value = String(formData.get("value") ?? "");
      if (!value) {
        failWith(slug, "Selecione uma opção.");
      }
      answers = deepSet(currentAnswers, step.path, value);
      break;
    }
    case "multi-select": {
      const values = formData.getAll("value").map(String);
      const min = step.minSelect ?? 0;
      const max = step.maxSelect ?? Infinity;
      if (values.length < min) {
        failWith(slug, `Selecione pelo menos ${min}.`);
      }
      if (values.length > max) {
        failWith(slug, `Selecione no máximo ${max}.`);
      }
      answers = deepSet(currentAnswers, step.path, values);
      break;
    }
    case "situation": {
      const values: Record<string, string> = {};
      for (const field of step.fields) {
        const value = String(formData.get(field.key) ?? "").trim();
        if (!value) {
          failWith(slug, "Preencha todos os campos desta situação.");
        }
        values[field.key] = value;
      }
      answers = deepSet(currentAnswers, step.path, values);
      break;
    }
    case "matrix": {
      const values: Record<string, string> = {};
      for (const row of step.rows) {
        const value = String(formData.get(row.value) ?? "");
        if (!value) {
          failWith(slug, "Responda todas as condições.");
        }
        values[row.value] = value;
      }
      answers = deepSet(currentAnswers, step.path, values);
      break;
    }
  }

  await db.diagnostic.update({
    where: { id: diagnostic.id },
    data: {
      ...(intention ? { intention } : {}),
      ...(answers ? { answers: answers as Prisma.InputJsonValue } : {}),
    },
  });

  const next = getNextSlug(slug);
  if (next) {
    redirect(`/diagnostico/${next}`);
  }

  await db.diagnostic.update({ where: { id: diagnostic.id }, data: { status: "CONCLUIDO" } });
  redirect("/diagnostico/concluido");
}
