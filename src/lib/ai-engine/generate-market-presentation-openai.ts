// Camada de apresentação de mercado — ADITIVA (ver market-presentation-prompt.ts).
// Recebe as 5 possibilidades já aprovadas de um round e devolve, numa única
// chamada, o enriquecimento das 5. Nunca decide nada sobre o conteúdo
// central das possibilidades — só a apresentação.
import { z } from "zod";
import { openai, OPENAI_GENERATION_MODEL } from "./openai-client";
import { MARKET_PRESENTATION_SYSTEM_PROMPT } from "./market-presentation-prompt";

const cenarioReferenciaSchema = z.object({
  aplica: z.boolean(),
  premissas: z.string().min(1),
  custos_estimados: z.string().min(1),
  resultado_liquido_estimado: z.string().min(1),
  comparacao_piso_magisterio: z.string().nullable(),
  aviso: z.string().min(1),
});

const itemSchema = z.object({
  ordem: z.number().int(),
  nome_de_mercado: z.string().nullable(),
  reconhecimento_mercado: z.string().min(1),
  compradores_nomeados: z.array(z.string().min(1)).min(1).max(5),
  cenario_referencia: cenarioReferenciaSchema,
  ponto_de_atencao_reformulado: z.string().min(1),
});

const responseSchema = z.object({
  possibilidades: z.array(itemSchema).length(5),
});

export type MarketPresentationResult = z.infer<typeof responseSchema>;
export type MarketPresentationItem = z.infer<typeof itemSchema>;

const CENARIO_JSON_SCHEMA = {
  type: "object",
  properties: {
    aplica: { type: "boolean" },
    premissas: { type: "string" },
    custos_estimados: { type: "string" },
    resultado_liquido_estimado: { type: "string" },
    comparacao_piso_magisterio: { type: ["string", "null"] },
    aviso: { type: "string" },
  },
  required: ["aplica", "premissas", "custos_estimados", "resultado_liquido_estimado", "comparacao_piso_magisterio", "aviso"],
  additionalProperties: false,
} as const;

const ITEM_JSON_SCHEMA = {
  type: "object",
  properties: {
    ordem: { type: "number" },
    nome_de_mercado: { type: ["string", "null"] },
    reconhecimento_mercado: { type: "string" },
    compradores_nomeados: { type: "array", items: { type: "string" } },
    cenario_referencia: CENARIO_JSON_SCHEMA,
    ponto_de_atencao_reformulado: { type: "string" },
  },
  required: [
    "ordem",
    "nome_de_mercado",
    "reconhecimento_mercado",
    "compradores_nomeados",
    "cenario_referencia",
    "ponto_de_atencao_reformulado",
  ],
  additionalProperties: false,
} as const;

const JSON_SCHEMA = {
  type: "object",
  properties: {
    possibilidades: { type: "array", items: ITEM_JSON_SCHEMA },
  },
  required: ["possibilidades"],
  additionalProperties: false,
} as const;

export type PossibilidadeParaApresentacao = {
  ordem: number;
  papel: string;
  titulo: string;
  comoFunciona: string;
  porQueCombinaComVoce: string;
  comoGerarReceita: string;
  primeiraValidacao: string;
  pontoDeAtencao: string;
  impressaoDigital: unknown;
};

function formatPossibilidade(p: PossibilidadeParaApresentacao): string {
  return `--- Possibilidade ${p.ordem} (${p.papel}) ---
Título: ${p.titulo}
A possibilidade: ${p.comoFunciona}
Por que combina com a pessoa: ${p.porQueCombinaComVoce}
Como pode gerar receita: ${p.comoGerarReceita}
Como validar: ${p.primeiraValidacao}
Ponto de atenção: ${p.pontoDeAtencao}
Impressão digital: ${JSON.stringify(p.impressaoDigital)}`;
}

export async function generateMarketPresentationOpenAI(params: {
  diagnosticInput: string;
  possibilidades: PossibilidadeParaApresentacao[];
}): Promise<MarketPresentationResult> {
  const userMessage = `${params.diagnosticInput}

AS 5 POSSIBILIDADES JÁ APROVADAS
${params.possibilidades.map(formatPossibilidade).join("\n\n")}`;

  const completion = await openai.chat.completions.create({
    model: OPENAI_GENERATION_MODEL,
    max_completion_tokens: 8000,
    messages: [
      { role: "system", content: MARKET_PRESENTATION_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "apresentacao_mercado", strict: true, schema: JSON_SCHEMA },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Resposta da OpenAI não contém texto.");
  }

  return responseSchema.parse(JSON.parse(content));
}
