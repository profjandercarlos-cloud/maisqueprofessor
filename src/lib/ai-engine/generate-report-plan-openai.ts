// Versão OpenAI de generate-report-plan.ts — a chamada mais pesada de todas
// (sempre 12 semanas, tarefas com hora estimada), a que mais sofria com o
// teto de 60s da Vercel Hobby via Anthropic. Mesmo prompt, saída estruturada
// (json_schema strict) em vez de extração de texto.
import { z } from "zod";
import { openai, OPENAI_GENERATION_MODEL } from "./openai-client";
import { REPORT_PLAN_SYSTEM_PROMPT } from "./report-plan-prompt";
import { PLAN_DURATION_SEMANAS } from "@/lib/plano/formula";

const taskSchema = z.object({
  texto: z.string().min(1),
  horas: z.number().positive(),
});

const weekSchema = z.object({
  meta: z.string().min(1),
  tarefas: z.array(taskSchema).min(1),
  dificuldades_antecipadas: z.string().min(1),
});

const responseSchema = z.object({
  relatorio: z.object({
    quem_aparece: z.string().min(1),
    padroes_que_se_repetem: z.string().min(1),
    por_que_esse_caminho: z.string().min(1),
    ja_possui_vs_aprender: z.string().min(1),
    ponto_de_atencao: z.string().min(1),
  }),
  semanas: z.array(weekSchema).min(1),
});

export type ReportAndPlan = z.infer<typeof responseSchema>;

const JSON_SCHEMA = {
  type: "object",
  properties: {
    relatorio: {
      type: "object",
      properties: {
        quem_aparece: { type: "string" },
        padroes_que_se_repetem: { type: "string" },
        por_que_esse_caminho: { type: "string" },
        ja_possui_vs_aprender: { type: "string" },
        ponto_de_atencao: { type: "string" },
      },
      required: [
        "quem_aparece",
        "padroes_que_se_repetem",
        "por_que_esse_caminho",
        "ja_possui_vs_aprender",
        "ponto_de_atencao",
      ],
      additionalProperties: false,
    },
    semanas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          meta: { type: "string" },
          tarefas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                texto: { type: "string" },
                horas: { type: "number" },
              },
              required: ["texto", "horas"],
              additionalProperties: false,
            },
          },
          dificuldades_antecipadas: { type: "string" },
        },
        required: ["meta", "tarefas", "dificuldades_antecipadas"],
        additionalProperties: false,
      },
    },
  },
  required: ["relatorio", "semanas"],
  additionalProperties: false,
} as const;

export async function generateReportAndPlanOpenAI(params: {
  diagnosticInput: string;
  possibility: {
    titulo: string;
    naPratica: string;
    porQueApareceu: string;
    quemPagaria: string;
    jaPossuiVsAprender: string;
  };
  horasTotais: number;
  horasPorSemana: number;
}): Promise<ReportAndPlan> {
  const userMessage = `${params.diagnosticInput}

POSSIBILIDADE APROVADA
Título: ${params.possibility.titulo}
Na prática: ${params.possibility.naPratica}
Por que apareceu: ${params.possibility.porQueApareceu}
Quem pagaria: ${params.possibility.quemPagaria}
Já possui vs. a aprender: ${params.possibility.jaPossuiVsAprender}

PARÂMETROS DO PLANO (já calculados, não decida isso)
Duração: sempre ${PLAN_DURATION_SEMANAS} semanas
Total de horas que o plano inteiro deve somar: ${params.horasTotais} horas
Tempo disponível por semana declarado pela pessoa: ${params.horasPorSemana} horas`;

  // Uma única tentativa, de propósito: cada chamada já leva 30-45s, e a
  // Vercel mata a função aos 60s (teto do plano Hobby) — não sobra tempo
  // pra uma segunda rodada dentro da mesma requisição. Se a contagem de
  // semanas vier errada, falha rápido e deixa a pessoa tentar de novo (nova
  // requisição, novo orçamento de 60s) em vez de arriscar estourar o tempo
  // tentando de novo aqui dentro.
  const completion = await openai.chat.completions.create({
    model: OPENAI_GENERATION_MODEL,
    max_completion_tokens: 16000,
    messages: [
      { role: "system", content: REPORT_PLAN_SYSTEM_PROMPT },
      {
        role: "user",
        content: `${userMessage}\n\nLEMBRETE FINAL: o array "semanas" da sua resposta precisa ter exatamente ${PLAN_DURATION_SEMANAS} elementos — nem ${PLAN_DURATION_SEMANAS - 1}, nem ${PLAN_DURATION_SEMANAS + 1}. Confira essa contagem antes de responder.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "relatorio_e_plano", strict: true, schema: JSON_SCHEMA },
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Resposta da OpenAI não contém texto.");
  }

  const parsed = responseSchema.parse(JSON.parse(content));

  return normalizeWeekCount(parsed);
}

// Em teste, o modelo às vezes devolve uma semana a mais (13 em vez de 12) —
// a estrutura em si sempre vem válida, só a contagem varia. Em vez de
// falhar (e gastar os ~40s da chamada à toa), funde as semanas excedentes
// na última: o mural + pool de pendências já construídos absorvem bem uma
// semana final mais cheia — a pessoa pode empurrar itens pro pool se achar
// pesado demais. Faltar semana (menos que o esperado) é bem mais raro e
// mais arriscado de "inventar" conteúdo, então esse caso continua falhando.
function normalizeWeekCount(parsed: ReportAndPlan): ReportAndPlan {
  if (parsed.semanas.length === PLAN_DURATION_SEMANAS) return parsed;

  if (parsed.semanas.length < PLAN_DURATION_SEMANAS) {
    throw new Error(
      `O modelo retornou ${parsed.semanas.length} semanas, esperado ${PLAN_DURATION_SEMANAS}.`,
    );
  }

  const kept = parsed.semanas.slice(0, PLAN_DURATION_SEMANAS - 1);
  const extra = parsed.semanas.slice(PLAN_DURATION_SEMANAS - 1);
  const lastWeek = extra[0];
  const mergedTasks = extra.flatMap((w) => w.tarefas);
  const mergedDificuldades = extra
    .map((w) => w.dificuldades_antecipadas)
    .filter(Boolean)
    .join(" ");

  return {
    ...parsed,
    semanas: [
      ...kept,
      { meta: lastWeek.meta, tarefas: mergedTasks, dificuldades_antecipadas: mergedDificuldades },
    ],
  };
}
