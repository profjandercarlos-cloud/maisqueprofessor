// TESTE — versão do motor das 5 possibilidades usando a OpenAI em vez da
// Anthropic, pra comparar velocidade/confiabilidade em produção (a versão
// Anthropic está estourando o limite de 60s da Vercel Hobby). Mesmo prompt,
// mesma regra de negócio — só troca o modelo e usa saída estruturada da
// OpenAI (json_schema strict), que garante JSON válido por construção, sem
// o risco de corte no meio que a extração de texto da Anthropic tem.
import { z } from "zod";
import type { PossibilityRole } from "@/generated/prisma/client";
import { openai, OPENAI_GENERATION_MODEL } from "./openai-client";
import { GENERATION_SYSTEM_PROMPT } from "./system-prompt";
import type { GenerationContext, GeneratedPossibility } from "./generate-possibilities";

const ROLE_MAP: Record<string, PossibilityRole> = {
  onde_ja_e_forte: "ONDE_JA_E_FORTE",
  para_onde_quer_ir: "PARA_ONDE_QUER_IR",
  o_que_pode_mobilizar: "O_QUE_PODE_MOBILIZAR",
  como_quer_trabalhar_e_crescer: "COMO_QUER_TRABALHAR_E_CRESCER",
  nao_considerada: "NAO_CONSIDERADA",
};

const PAPEL_VALUES = Object.keys(ROLE_MAP) as [string, ...string[]];

const possibilitySchema = z.object({
  papel: z.enum(PAPEL_VALUES),
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

const JSON_SCHEMA = {
  type: "object",
  properties: {
    possibilidades: {
      type: "array",
      items: {
        type: "object",
        properties: {
          papel: { type: "string", enum: PAPEL_VALUES },
          titulo: { type: "string" },
          subtitulo: { type: "string" },
          na_pratica: { type: "string" },
          por_que_apareceu: { type: "string" },
          quem_pagaria: { type: "string" },
          ja_possui_vs_aprender: { type: "string" },
          familia_valor: { type: "string" },
        },
        required: [
          "papel",
          "titulo",
          "subtitulo",
          "na_pratica",
          "por_que_apareceu",
          "quem_pagaria",
          "ja_possui_vs_aprender",
          "familia_valor",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["possibilidades"],
  additionalProperties: false,
} as const;

function buildUserMessage({ diagnosticInput, feedback, rejectedTitles }: GenerationContext): string {
  let message = diagnosticInput;
  if (feedback) message += `\n\nFEEDBACK DO PROFESSOR SOBRE O CONJUNTO ANTERIOR:\n${feedback}`;
  if (rejectedTitles && rejectedTitles.length > 0) {
    message += `\n\nPOSSIBILIDADES REJEITADAS ANTERIORMENTE (não repetir):\n${rejectedTitles.map((t) => `- ${t}`).join("\n")}`;
  }
  return message;
}

export async function generatePossibilitiesOpenAI(
  context: GenerationContext,
): Promise<GeneratedPossibility[]> {
  const completion = await openai.chat.completions.create({
    model: OPENAI_GENERATION_MODEL,
    max_completion_tokens: 16000,
    messages: [
      { role: "system", content: GENERATION_SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(context) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "possibilidades", strict: true, schema: JSON_SCHEMA },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Resposta da OpenAI não contém texto.");
  }

  const parsed = responseSchema.parse(JSON.parse(content));

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
