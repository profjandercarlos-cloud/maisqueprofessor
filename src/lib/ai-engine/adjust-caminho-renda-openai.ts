// "Ajustar com IA" — corrige só o que a nota de revisão do administrador
// aponta, devolvendo o registro completo (ver adjust-caminho-renda-prompt.ts).
// Usado por src/app/admin/caminhos-de-renda/actions.ts.
import { z } from "zod";
import { openai, OPENAI_GENERATION_MODEL } from "./openai-client";
import { ADJUST_CAMINHO_RENDA_SYSTEM_PROMPT } from "./adjust-caminho-renda-prompt";
import { logAiUsage } from "./log-ai-usage";

const FORCA_EVIDENCIA_VALUES = [
  "oferta_publicada",
  "pedido_documentado",
  "selecao_concluida",
  "contrato_com_valor",
  "piloto_pago_do_professor",
] as const;

const RELACAO_DOCENCIA_VALUES = ["ensino_fora_da_escola", "educacao_sem_aula", "outro_setor"] as const;

const fonteSchema = z.object({
  url: z.string().min(1),
  natureza: z.string().min(1),
  afirma: z.string().min(1),
});

const precoReferenciaSchema = z.object({
  valor_brl: z.number(),
  unidade: z.string().min(1),
  escopo_comparavel: z.boolean(),
  fonte: z.string().min(1),
});

const caminhoRendaSchema = z.object({
  titulo: z.string().min(1),
  posicionamento: z.string().min(1),
  categoria_mercado: z.string().min(1),
  comprador_segmento: z.string().min(1),
  comprador_persona: z.string().min(1),
  gatilho: z.string().min(1),
  forca_evidencia: z.enum(FORCA_EVIDENCIA_VALUES),
  fontes: z.array(fonteSchema).min(1),
  capacidade_a_verificar: z.string().min(1),
  relacao_com_docencia: z.enum(RELACAO_DOCENCIA_VALUES),
  restricoes: z.string().nullable(),
  primeira_entrega_vendavel: z.string().min(1),
  canal_de_acesso: z.string().min(1),
  modelo_de_receita: z.string().min(1),
  como_cresce: z.string().min(1),
  risco_estrutural: z.string().min(1),
  preco_referencia_externa: precoReferenciaSchema.nullable(),
  preco_primeiro_contrato_real: z.number().nullable(),
  horas_reais_por_entrega: z.number().nullable(),
  renda_mensal_liquida_observada: z.number().nullable(),
  habilidade_nuclear: z.string().min(1),
  modalidade: z.string().min(1),
  capital: z.string().min(1),
  mecanismo_renda: z.string().min(1),
  investigavel_no_diagnostico: z.boolean(),
  grupo_de_ofertas_semelhantes: z.string().nullable(),
  principal_lacuna: z.string().min(1),
  teste_piloto_necessario: z.string().min(1),
});

export type CaminhoRendaWire = z.infer<typeof caminhoRendaSchema>;

const CAMINHO_RENDA_JSON_SCHEMA_PROPERTIES = {
  titulo: { type: "string" },
  posicionamento: { type: "string" },
  categoria_mercado: { type: "string" },
  comprador_segmento: { type: "string" },
  comprador_persona: { type: "string" },
  gatilho: { type: "string" },
  forca_evidencia: { type: "string", enum: FORCA_EVIDENCIA_VALUES },
  fontes: {
    type: "array",
    items: {
      type: "object",
      properties: { url: { type: "string" }, natureza: { type: "string" }, afirma: { type: "string" } },
      required: ["url", "natureza", "afirma"],
      additionalProperties: false,
    },
  },
  capacidade_a_verificar: { type: "string" },
  relacao_com_docencia: { type: "string", enum: RELACAO_DOCENCIA_VALUES },
  restricoes: { type: ["string", "null"] },
  primeira_entrega_vendavel: { type: "string" },
  canal_de_acesso: { type: "string" },
  modelo_de_receita: { type: "string" },
  como_cresce: { type: "string" },
  risco_estrutural: { type: "string" },
  preco_referencia_externa: {
    type: ["object", "null"],
    properties: {
      valor_brl: { type: "number" },
      unidade: { type: "string" },
      escopo_comparavel: { type: "boolean" },
      fonte: { type: "string" },
    },
    required: ["valor_brl", "unidade", "escopo_comparavel", "fonte"],
    additionalProperties: false,
  },
  preco_primeiro_contrato_real: { type: ["number", "null"] },
  horas_reais_por_entrega: { type: ["number", "null"] },
  renda_mensal_liquida_observada: { type: ["number", "null"] },
  habilidade_nuclear: { type: "string" },
  modalidade: { type: "string" },
  capital: { type: "string" },
  mecanismo_renda: { type: "string" },
  investigavel_no_diagnostico: { type: "boolean" },
  grupo_de_ofertas_semelhantes: { type: ["string", "null"] },
  principal_lacuna: { type: "string" },
  teste_piloto_necessario: { type: "string" },
} as const;

const CAMINHO_RENDA_JSON_SCHEMA_REQUIRED = Object.keys(CAMINHO_RENDA_JSON_SCHEMA_PROPERTIES);

const responseSchema = z.object({
  registro_corrigido: caminhoRendaSchema,
});

const JSON_SCHEMA = {
  type: "object",
  properties: {
    registro_corrigido: {
      type: "object",
      properties: CAMINHO_RENDA_JSON_SCHEMA_PROPERTIES,
      required: CAMINHO_RENDA_JSON_SCHEMA_REQUIRED,
      additionalProperties: false,
    },
  },
  required: ["registro_corrigido"],
  additionalProperties: false,
} as const;

export async function adjustCaminhoRendaOpenAI(params: {
  registro: CaminhoRendaWire;
  nota: string;
}): Promise<CaminhoRendaWire> {
  const userMessage = `REGISTRO ATUAL
${JSON.stringify(params.registro, null, 2)}

NOTA DO ADMINISTRADOR
${params.nota}`;

  const completion = await openai.chat.completions.create({
    model: OPENAI_GENERATION_MODEL,
    max_completion_tokens: 4000,
    messages: [
      { role: "system", content: ADJUST_CAMINHO_RENDA_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "ajuste_caminho_renda", strict: true, schema: JSON_SCHEMA },
    },
  });
  await logAiUsage("adjust-caminho-renda", OPENAI_GENERATION_MODEL, completion.usage);

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Resposta da OpenAI (ajuste de caminho de renda) não contém texto.");
  }

  return responseSchema.parse(JSON.parse(content)).registro_corrigido;
}
