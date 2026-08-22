import { z } from "zod";
import type { PossibilityRole } from "@/generated/prisma/client";
import { anthropic, GENERATION_MODEL } from "./client";
import { GENERATION_SYSTEM_PROMPT } from "./system-prompt";
import { formatDiagnosticInput } from "./format-diagnostic-input";

const ROLE_MAP: Record<string, PossibilityRole> = {
  onde_ja_e_forte: "ONDE_JA_E_FORTE",
  para_onde_quer_ir: "PARA_ONDE_QUER_IR",
  o_que_pode_mobilizar: "O_QUE_PODE_MOBILIZAR",
  como_quer_trabalhar_e_crescer: "COMO_QUER_TRABALHAR_E_CRESCER",
  nao_considerada: "NAO_CONSIDERADA",
};

const possibilitySchema = z.object({
  papel: z.enum([
    "onde_ja_e_forte",
    "para_onde_quer_ir",
    "o_que_pode_mobilizar",
    "como_quer_trabalhar_e_crescer",
    "nao_considerada",
  ]),
  titulo: z.string().min(1),
  subtitulo: z.string().min(1),
  na_pratica: z.string().min(1),
  por_que_apareceu: z.string().min(1),
  quem_pagaria: z.string().min(1),
  ja_possui_vs_aprender: z.string().min(1),
  familia_valor: z.string().min(1),
});

const responseSchema = z.object({
  possibilidades: z.array(possibilitySchema).length(5),
});

export type GeneratedPossibility = {
  papel: PossibilityRole;
  titulo: string;
  subtitulo: string;
  naPratica: string;
  porQueApareceu: string;
  quemPagaria: string;
  jaPossuiVsAprender: string;
  familiaValor: string;
};

export type GenerationContext = {
  diagnosticInput: string;
  feedback?: string;
  rejectedTitles?: string[];
};

function buildUserMessage({ diagnosticInput, feedback, rejectedTitles }: GenerationContext): string {
  let message = diagnosticInput;

  if (feedback) {
    message += `\n\nFEEDBACK DO PROFESSOR SOBRE O CONJUNTO ANTERIOR:\n${feedback}`;
  }

  if (rejectedTitles && rejectedTitles.length > 0) {
    message += `\n\nPOSSIBILIDADES REJEITADAS ANTERIORMENTE (não repetir):\n${rejectedTitles.map((t) => `- ${t}`).join("\n")}`;
  }

  return message;
}

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Resposta do modelo não contém um objeto JSON.");
  }
  return JSON.parse(text.slice(start, end + 1));
}

export async function generatePossibilities(
  context: GenerationContext,
): Promise<GeneratedPossibility[]> {
  // 5 possibilidades × 8 campos de texto cada é bastante conteúdo — 8000
  // tokens ocasionalmente cortava a resposta no meio do JSON (confirmado em
  // teste real: SyntaxError de array incompleto). Mesmo ajuste já aplicado
  // em generate-report-plan.ts pelo mesmo motivo.
  const message = await anthropic.messages.create({
    model: GENERATION_MODEL,
    max_tokens: 16000,
    system: GENERATION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserMessage(context) }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Resposta do modelo não contém texto.");
  }

  const parsed = responseSchema.parse(extractJson(textBlock.text));

  const roles = new Set(parsed.possibilidades.map((p) => p.papel));
  if (roles.size !== 5) {
    throw new Error("O modelo retornou papéis repetidos ou ausentes entre as 5 possibilidades.");
  }

  return parsed.possibilidades.map((p) => ({
    papel: ROLE_MAP[p.papel],
    titulo: p.titulo,
    subtitulo: p.subtitulo,
    naPratica: p.na_pratica,
    porQueApareceu: p.por_que_apareceu,
    quemPagaria: p.quem_pagaria,
    jaPossuiVsAprender: p.ja_possui_vs_aprender,
    familiaValor: p.familia_valor,
  }));
}

export { formatDiagnosticInput };
