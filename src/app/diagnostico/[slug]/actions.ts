"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import type { Intention, Prisma, RotaProfissional } from "@/generated/prisma/client";
import { getStepBySlug, getNextSlug, ROTA_PROFISSIONAL_SLUG } from "@/lib/diagnostico/steps";
import { getOrCreateActiveDiagnostic } from "@/lib/diagnostico/get-active-diagnostic";
import { deepGet, deepSet } from "@/lib/wizard/deep-set";
import { otherDetailPath } from "@/lib/wizard/step-types";

const SKIP_SENTINEL = "__SEM_RESPOSTA__";
const GENERIC_ACAO_ANSWERS = ["ajudei", "participei", "dei suporte", "ajudei a organizar", "dei apoio"];

function failWith(slug: string, message: string): never {
  redirect(`/diagnostico/${slug}?error=${encodeURIComponent(message)}`);
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function saveStep(slug: string, formData: FormData) {
  const user = await requireActiveAccess();

  const diagnostic = await getOrCreateActiveDiagnostic(user.id);
  const rota = diagnostic.rotaProfissional;

  const step = getStepBySlug(slug, rota);
  if (!step) redirect("/diagnostico/intencao");

  const currentAnswers = diagnostic.answers as Record<string, unknown>;

  let intention: Intention | undefined;
  let rotaProfissional: RotaProfissional | undefined;
  let answers: Record<string, unknown> | undefined = currentAnswers;

  switch (step.type) {
    case "intention": {
      const value = String(formData.get("value") ?? "");
      if (!["SAIR", "COMPLEMENTAR", "NAO_SEI", "JA_FORA_DA_SALA"].includes(value)) {
        failWith(slug, "Selecione uma opção.");
      }
      intention = value as Intention;
      break;
    }
    case "textarea": {
      const skip = step.allowSkipWithCheckbox && formData.get("skip") === "on";
      if (skip) {
        answers = deepSet(answers, step.path, SKIP_SENTINEL);
        break;
      }
      const value = String(formData.get("value") ?? "").trim();
      if (!step.optional && !value) {
        failWith(slug, "Este campo é obrigatório.");
      }
      if (value && step.minChars && value.length < step.minChars) {
        failWith(slug, `Escreva pelo menos ${step.minChars} caracteres.`);
      }
      if (value && step.maxChars && value.length > step.maxChars) {
        failWith(slug, `Escreva no máximo ${step.maxChars} caracteres.`);
      }
      answers = deepSet(answers, step.path, value);
      break;
    }
    case "number": {
      const value = Number(formData.get("value"));
      if (Number.isNaN(value) || value < step.min || value > step.max) {
        failWith(slug, `Informe um valor entre ${step.min} e ${step.max}.`);
      }
      answers = deepSet(answers, step.path, value);
      break;
    }
    case "single-select": {
      const value = String(formData.get("value") ?? "");
      if (!value) {
        failWith(slug, "Selecione uma opção.");
      }
      answers = deepSet(answers, step.path, value);
      if (step.allowOther) {
        const detail = String(formData.get("outro_detalhe") ?? "").trim();
        answers = deepSet(answers, otherDetailPath(step.path), detail);
      }
      if (slug === ROTA_PROFISSIONAL_SLUG) {
        if (!["CARREIRA", "CRIACAO_VALOR", "EXPLORACAO"].includes(value)) {
          failWith(slug, "Selecione uma opção.");
        }
        rotaProfissional = value as RotaProfissional;
      }
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
      answers = deepSet(answers, step.path, values);
      if (step.allowOther) {
        const detail = String(formData.get("outro_detalhe") ?? "").trim();
        answers = deepSet(answers, otherDetailPath(step.path), detail);
      }
      break;
    }
    case "situation": {
      const values: Record<string, string> = {};
      for (const field of step.fields) {
        const value = String(formData.get(field.key) ?? "").trim();
        if (!value) {
          failWith(slug, "Preencha todos os campos desta situação.");
        }
        if (field.minChars && value.length < field.minChars) {
          failWith(slug, `"${field.label}" precisa ter pelo menos ${field.minChars} caracteres.`);
        }
        if (field.maxChars && value.length > field.maxChars) {
          failWith(slug, `"${field.label}" pode ter no máximo ${field.maxChars} caracteres.`);
        }
        values[field.key] = value;
      }
      if (values.acao && GENERIC_ACAO_ANSWERS.includes(normalize(values.acao))) {
        failWith(slug, "Descreva sua contribuição específica — o que exatamente você fez, decidiu ou mudou.");
      }
      if (step.rejectIfSameAs) {
        const other = deepGet(currentAnswers, step.rejectIfSameAs) as Record<string, string> | undefined;
        if (other) {
          // Nunca usar Object.values aqui: o JSONB do Postgres reordena as
          // chaves do objeto (por tamanho, depois alfabética) ao serializar
          // de volta, então a ordem de "other" (vindo do banco) não bate
          // com a ordem de inserção de "values" (montado agora) mesmo
          // quando o conteúdo é idêntico — precisa concatenar pela mesma
          // ordem fixa de campos dos dois lados.
          const fieldKeys = step.fields.map((f) => f.key);
          const otherText = normalize(fieldKeys.map((k) => other[k] ?? "").join(" "));
          const thisText = normalize(fieldKeys.map((k) => values[k] ?? "").join(" "));
          if (otherText && otherText === thisText) {
            failWith(slug, "Essa situação está praticamente idêntica à anterior — conte algo diferente.");
          }
        }
      }
      answers = deepSet(answers, step.path, values);
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
      answers = deepSet(answers, step.path, values);
      break;
    }
  }

  await db.diagnostic.update({
    where: { id: diagnostic.id },
    data: {
      ...(intention ? { intention } : {}),
      ...(rotaProfissional ? { rotaProfissional } : {}),
      ...(answers ? { answers: answers as Prisma.InputJsonValue } : {}),
    },
  });

  const effectiveRota = rotaProfissional ?? rota;
  const next = getNextSlug(slug, effectiveRota);
  if (next) {
    redirect(`/diagnostico/${next}`);
  }

  await db.diagnostic.update({ where: { id: diagnostic.id }, data: { status: "CONCLUIDO" } });
  redirect("/diagnostico/concluido");
}
