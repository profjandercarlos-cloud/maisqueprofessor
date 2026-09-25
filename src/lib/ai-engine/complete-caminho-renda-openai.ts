// Preenche os 3 campos que a pesquisa manual do acervo não cobriu
// (posicionamento, relação com docência, risco estrutural) — usado só na
// importação do lote inicial (ver _importar_caminhos_renda.ts).
import { z } from "zod";
import { openai, OPENAI_GENERATION_MODEL } from "./openai-client";
import { COMPLETE_CAMINHO_RENDA_SYSTEM_PROMPT } from "./complete-caminho-renda-prompt";
import { logAiUsage } from "./log-ai-usage";

const RELACAO_DOCENCIA_VALUES = ["ensino_fora_da_escola", "educacao_sem_aula", "outro_setor"] as const;

const responseSchema = z.object({
  posicionamento: z.string().min(1),
  relacao_com_docencia: z.enum(RELACAO_DOCENCIA_VALUES),
  risco_estrutural: z.string().min(1),
});

export type CamposCompletados = z.infer<typeof responseSchema>;

const JSON_SCHEMA = {
  type: "object",
  properties: {
    posicionamento: { type: "string" },
    relacao_com_docencia: { type: "string", enum: RELACAO_DOCENCIA_VALUES },
    risco_estrutural: { type: "string" },
  },
  required: ["posicionamento", "relacao_com_docencia", "risco_estrutural"],
  additionalProperties: false,
} as const;

export async function completeCaminhoRendaOpenAI(registro: {
  titulo: string;
  categoriaMercado: string;
  compradorSegmento: string;
  compradorPersona: string;
  gatilho: string;
  primeiraEntregaVendavel: string;
  canalDeAcesso: string;
  modeloDeReceita: string;
  comoCresce: string;
  principalLacuna: string;
}): Promise<CamposCompletados> {
  const userMessage = `REGISTRO JÁ PESQUISADO
Título: ${registro.titulo}
Categoria de mercado: ${registro.categoriaMercado}
Segmento comprador: ${registro.compradorSegmento}
Persona compradora: ${registro.compradorPersona}
Gatilho da demanda: ${registro.gatilho}
Primeira entrega vendável: ${registro.primeiraEntregaVendavel}
Canal de acesso: ${registro.canalDeAcesso}
Modelo de receita: ${registro.modeloDeReceita}
Como cresce: ${registro.comoCresce}
Principal lacuna já identificada: ${registro.principalLacuna}`;

  const completion = await openai.chat.completions.create({
    model: OPENAI_GENERATION_MODEL,
    max_completion_tokens: 1500,
    messages: [
      { role: "system", content: COMPLETE_CAMINHO_RENDA_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "campos_completados", strict: true, schema: JSON_SCHEMA },
    },
  });
  await logAiUsage("complete-caminho-renda", OPENAI_GENERATION_MODEL, completion.usage);

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Resposta da OpenAI (completar caminho de renda) não contém texto.");
  }

  return responseSchema.parse(JSON.parse(content));
}
