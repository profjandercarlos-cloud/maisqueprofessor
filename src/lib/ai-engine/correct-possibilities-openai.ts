// Corretor pontual (novo no V4) — nunca regenera as 5 possibilidades, só o(s)
// papel(is) sinalizado(s) pelo auditor (modo "auditor") ou, como último
// recurso, expande uma reserva já esboçada na 1ª geração (modo "reserva",
// ver run-generation-pipeline.ts). Devolve o(s) item(ns) no mesmo shape
// snake_case do gerador — quem mescla no rascunho e mapeia pro banco é o
// pipeline, na hora de persistir.
import { z } from "zod";
import { openai, OPENAI_GENERATION_MODEL } from "./openai-client";
import { CORRECTOR_SYSTEM_PROMPT } from "./corrector-prompt";
import {
  possibilitySchema,
  POSSIBILITY_JSON_SCHEMA_PROPERTIES,
  POSSIBILITY_JSON_SCHEMA_REQUIRED,
} from "./generate-possibilities-openai";

const responseSchema = z.object({
  possibilidades_corrigidas: z.array(possibilitySchema).min(1).max(5),
});

export type CorrectedDraft = z.infer<typeof responseSchema>;

const JSON_SCHEMA = {
  type: "object",
  properties: {
    possibilidades_corrigidas: {
      type: "array",
      items: {
        type: "object",
        properties: POSSIBILITY_JSON_SCHEMA_PROPERTIES,
        required: POSSIBILITY_JSON_SCHEMA_REQUIRED,
        additionalProperties: false,
      },
    },
  },
  required: ["possibilidades_corrigidas"],
  additionalProperties: false,
} as const;

export type CorrectorParams = {
  entradaTexto: string;
  // Possibilidades mantidas (objetos crus do rascunho, snake_case) — só pra
  // dar contexto de território já ocupado, nunca reescritas.
  mantidas: unknown[];
} & (
  | { modo: "auditor"; papeisSubstituir: { ordem: number; papel: string; motivos: string[] }[] }
  | {
      modo: "reserva";
      ordem: number;
      papel: string;
      reserva: {
        territorio: string;
        problema: string;
        publico: string;
        pagador: string;
        entrega: string;
        modeloReceita: string;
        motivoReserva: string;
      };
    }
);

function buildUserMessage(params: CorrectorParams): string {
  const base = `${params.entradaTexto}

POSSIBILIDADES MANTIDAS (não reescrever — só contexto de território já ocupado)
${JSON.stringify(params.mantidas)}`;

  if (params.modo === "auditor") {
    return `${base}

MODO: correção guiada pelo auditor

PAPÉIS A SUBSTITUIR E MOTIVOS
${params.papeisSubstituir
  .map((p) => `- Ordem ${p.ordem} (${p.papel}): ${p.motivos.join(" | ")}`)
  .join("\n")}

Gere o(s) objeto(s) de possibilidade completos só para a(s) ordem(ns) acima, cumprindo cada motivo.`;
  }

  return `${base}

MODO: promoção de reserva

PAPEL A EXPANDIR: ordem ${params.ordem} (${params.papel})
RESERVA A EXPANDIR
${JSON.stringify({
  territorio: params.reserva.territorio,
  problema: params.reserva.problema,
  publico: params.reserva.publico,
  pagador: params.reserva.pagador,
  entrega: params.reserva.entrega,
  modelo_receita: params.reserva.modeloReceita,
  motivo_reserva: params.reserva.motivoReserva,
})}

Gere o objeto de possibilidade completo pra essa ordem, expandindo a reserva acima.`;
}

export async function correctPossibilitiesOpenAI(params: CorrectorParams): Promise<CorrectedDraft> {
  const completion = await openai.chat.completions.create({
    model: OPENAI_GENERATION_MODEL,
    max_completion_tokens: 10000,
    messages: [
      { role: "system", content: CORRECTOR_SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(params) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "correcao_v5", strict: true, schema: JSON_SCHEMA },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Resposta da OpenAI (corretor) não contém texto.");
  }

  const parsed = responseSchema.parse(JSON.parse(content));

  const expectedCount = params.modo === "auditor" ? params.papeisSubstituir.length : 1;
  if (parsed.possibilidades_corrigidas.length !== expectedCount) {
    throw new Error(
      `O corretor devolveu ${parsed.possibilidades_corrigidas.length} possibilidade(s), esperado ${expectedCount}.`,
    );
  }

  return parsed;
}
