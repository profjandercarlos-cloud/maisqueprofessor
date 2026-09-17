// Auditor semântico V4 — segunda chamada de IA, independente do gerador, que
// decide papel por papel se o rascunho pode ser aprovado ou precisa de
// correção pontual (ver run-generation-pipeline.ts). Espelha a seção
// C-FINAL do prompt do auditor (auditor-prompt.ts). Reaproveitado também
// como "verificação final curta" depois de uma correção — mesma função,
// chamada de novo com o rascunho já corrigido.
import { z } from "zod";
import { openai, OPENAI_GENERATION_MODEL } from "./openai-client";
import { AUDITOR_SYSTEM_PROMPT } from "./auditor-prompt";

// "motivo" é um array de { ordem, motivos } — não um dicionário esparso
// (ex.: { "4": [...] }) porque o modo strict da OpenAI exige que TODO campo
// declarado em "properties" de um objeto apareça em "required"; um
// dicionário só com as chaves dos papéis substituídos violaria essa regra.
const motivoItemSchema = z.object({
  ordem: z.number().int().min(1).max(5),
  motivos: z.array(z.string().min(1)).min(1),
});

const auditResponseSchema = z.object({
  status: z.enum(["aprovar", "corrigir"]),
  manter: z.array(z.number().int().min(1).max(5)),
  substituir: z.array(z.number().int().min(1).max(5)),
  motivo: z.array(motivoItemSchema),
});

export type AuditResult = z.infer<typeof auditResponseSchema>;

const JSON_SCHEMA = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["aprovar", "corrigir"] },
    manter: { type: "array", items: { type: "number" } },
    substituir: { type: "array", items: { type: "number" } },
    motivo: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ordem: { type: "number" },
          motivos: { type: "array", items: { type: "string" } },
        },
        required: ["ordem", "motivos"],
        additionalProperties: false,
      },
    },
  },
  required: ["status", "manter", "substituir", "motivo"],
  additionalProperties: false,
} as const;

export async function auditPossibilitiesOpenAI(params: {
  entrada: string;
  rascunho: unknown;
  tentativa: number;
}): Promise<AuditResult> {
  const userMessage = `ENTRADA ORIGINAL COMPLETA
${params.entrada}

RASCUNHO DO GERADOR V4 (verificação ${params.tentativa})
${JSON.stringify(params.rascunho)}`;

  const completion = await openai.chat.completions.create({
    model: OPENAI_GENERATION_MODEL,
    max_completion_tokens: 4000,
    messages: [
      { role: "system", content: AUDITOR_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "auditoria_v4", strict: true, schema: JSON_SCHEMA },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Resposta da OpenAI (auditor) não contém texto.");
  }

  const parsed = auditResponseSchema.parse(JSON.parse(content));

  const todasOrdens = new Set([...parsed.manter, ...parsed.substituir]);
  if (todasOrdens.size !== 5 || parsed.manter.length + parsed.substituir.length !== 5) {
    throw new Error("O auditor não cobriu exatamente as 5 ordens entre manter e substituir, sem repetição.");
  }
  if (parsed.status === "aprovar" && parsed.substituir.length !== 0) {
    throw new Error("O auditor aprovou mas listou papéis para substituir.");
  }
  if (parsed.status === "corrigir" && parsed.substituir.length === 0) {
    throw new Error("O auditor pediu correção mas não listou nenhum papel para substituir.");
  }
  for (const ordem of parsed.substituir) {
    if (!parsed.motivo.some((m) => m.ordem === ordem)) {
      throw new Error(`O auditor marcou a ordem ${ordem} para substituir mas não deu motivo.`);
    }
  }

  return parsed;
}
