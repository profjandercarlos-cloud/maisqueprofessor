import { z } from "zod";
import { anthropic, GENERATION_MODEL } from "./client";
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

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Resposta do modelo não contém um objeto JSON.");
  }
  return JSON.parse(text.slice(start, end + 1));
}

export async function generateReportAndPlan(params: {
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

  // Antes o plano podia ter só 2 semanas (Exploração); agora são sempre 12,
  // cada tarefa como objeto {texto, horas} — a resposta ficou bem maior, e
  // 8000 tokens cortava o JSON no meio em planos com mais tarefas.
  const message = await anthropic.messages.create({
    model: GENERATION_MODEL,
    max_tokens: 16000,
    system: REPORT_PLAN_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Resposta do modelo não contém texto.");
  }

  const parsed = responseSchema.parse(extractJson(textBlock.text));

  if (parsed.semanas.length !== PLAN_DURATION_SEMANAS) {
    throw new Error(
      `O modelo retornou ${parsed.semanas.length} semanas, esperado ${PLAN_DURATION_SEMANAS}.`,
    );
  }

  return parsed;
}
