// Mapa de Execução (novo arquivo no V4) — antes era gerado junto com as 5
// possibilidades (5 mapas por rodada, 4 nunca usados); agora é uma chamada
// separada, disparada só depois que o professor aprova UMA possibilidade
// (ver src/app/adequacao/[possibilityId]/concluido/actions.ts). O tipo
// MapaExecucao é o mesmo de antes — só mudou de dono (não fica mais em
// generate-possibilities-openai.ts) e quando é preenchido.
import { z } from "zod";
import { openai, OPENAI_GENERATION_MODEL } from "./openai-client";
import { MAPA_EXECUCAO_SYSTEM_PROMPT } from "./generate-mapa-execucao-prompt";
import { logAiUsage } from "./log-ai-usage";

export type MapaExecucao = {
  objetivoPrincipal: string;
  resultadoMinimoViavel: string;
  esforcoMinimoHoras: number;
  esforcoRecomendadoHoras: number;
  esforcoAvancadoHoras: number;
  ttfrBaseSemanas: number;
  competenciasNecessarias: string[];
  competenciasADesenvolver: string[];
  acoesEssenciais: string[];
  nivelComplexidade: string;
  principaisDependencias: string[];
  primeiroResultadoObservavel: string;
};

const mapaExecucaoSchema = z.object({
  objetivo_principal: z.string().min(1),
  resultado_minimo_viavel: z.string().min(1),
  esforco_minimo_horas: z.number().positive(),
  esforco_recomendado_horas: z.number().positive(),
  esforco_avancado_horas: z.number().positive(),
  ttfr_base_semanas: z.number().positive(),
  competencias_necessarias: z.array(z.string().min(1)),
  competencias_a_desenvolver: z.array(z.string().min(1)),
  acoes_essenciais: z.array(z.string().min(1)),
  nivel_complexidade: z.string().min(1),
  principais_dependencias: z.array(z.string().min(1)),
  primeiro_resultado_observavel: z.string().min(1),
});

const JSON_SCHEMA = {
  type: "object",
  properties: {
    objetivo_principal: { type: "string" },
    resultado_minimo_viavel: { type: "string" },
    esforco_minimo_horas: { type: "number" },
    esforco_recomendado_horas: { type: "number" },
    esforco_avancado_horas: { type: "number" },
    ttfr_base_semanas: { type: "number" },
    competencias_necessarias: { type: "array", items: { type: "string" } },
    competencias_a_desenvolver: { type: "array", items: { type: "string" } },
    acoes_essenciais: { type: "array", items: { type: "string" } },
    nivel_complexidade: { type: "string" },
    principais_dependencias: { type: "array", items: { type: "string" } },
    primeiro_resultado_observavel: { type: "string" },
  },
  required: [
    "objetivo_principal",
    "resultado_minimo_viavel",
    "esforco_minimo_horas",
    "esforco_recomendado_horas",
    "esforco_avancado_horas",
    "ttfr_base_semanas",
    "competencias_necessarias",
    "competencias_a_desenvolver",
    "acoes_essenciais",
    "nivel_complexidade",
    "principais_dependencias",
    "primeiro_resultado_observavel",
  ],
  additionalProperties: false,
} as const;

export async function generateMapaExecucaoOpenAI(params: {
  diagnosticInput: string;
  possibility: {
    titulo: string;
    comoFunciona: string;
    porQueCombinaComVoce: string;
    comoGerarReceita: string;
    primeiraValidacao: string;
    pontoDeAtencao: string;
  };
}): Promise<MapaExecucao> {
  const userMessage = `${params.diagnosticInput}

POSSIBILIDADE ESCOLHIDA PELO PROFESSOR
Título: ${params.possibility.titulo}
A possibilidade: ${params.possibility.comoFunciona}
Por que combina com a pessoa: ${params.possibility.porQueCombinaComVoce}
Como pode gerar receita: ${params.possibility.comoGerarReceita}
Como validar: ${params.possibility.primeiraValidacao}
Ponto de atenção: ${params.possibility.pontoDeAtencao}`;

  const completion = await openai.chat.completions.create({
    model: OPENAI_GENERATION_MODEL,
    max_completion_tokens: 3000,
    messages: [
      { role: "system", content: MAPA_EXECUCAO_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "mapa_execucao_v4", strict: true, schema: JSON_SCHEMA },
    },
  });
  await logAiUsage("generate-mapa-execucao", OPENAI_GENERATION_MODEL, completion.usage);

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Resposta da OpenAI (mapa de execução) não contém texto.");
  }

  const parsed = mapaExecucaoSchema.parse(JSON.parse(content));

  if (
    !(parsed.esforco_minimo_horas < parsed.esforco_recomendado_horas &&
      parsed.esforco_recomendado_horas < parsed.esforco_avancado_horas)
  ) {
    throw new Error("Os esforços do mapa de execução precisam crescer estritamente entre os 3 níveis.");
  }

  return {
    objetivoPrincipal: parsed.objetivo_principal,
    resultadoMinimoViavel: parsed.resultado_minimo_viavel,
    esforcoMinimoHoras: parsed.esforco_minimo_horas,
    esforcoRecomendadoHoras: parsed.esforco_recomendado_horas,
    esforcoAvancadoHoras: parsed.esforco_avancado_horas,
    ttfrBaseSemanas: parsed.ttfr_base_semanas,
    competenciasNecessarias: parsed.competencias_necessarias,
    competenciasADesenvolver: parsed.competencias_a_desenvolver,
    acoesEssenciais: parsed.acoes_essenciais,
    nivelComplexidade: parsed.nivel_complexidade,
    principaisDependencias: parsed.principais_dependencias,
    primeiroResultadoObservavel: parsed.primeiro_resultado_observavel,
  };
}
