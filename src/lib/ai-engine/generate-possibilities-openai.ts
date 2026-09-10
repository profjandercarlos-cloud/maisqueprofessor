// Motor das 5 possibilidades — migrado de Anthropic pra OpenAI (a versão
// Anthropic estourava o limite de 60s da Vercel Hobby de forma
// inconsistente). Usa saída estruturada da OpenAI (json_schema strict), que
// garante JSON válido por construção, sem risco de corte no meio.
import { z } from "zod";
import type { PossibilityRole } from "@/generated/prisma/client";
import { openai, OPENAI_GENERATION_MODEL } from "./openai-client";
import { GENERATION_SYSTEM_PROMPT } from "./system-prompt";

export type GenerationContext = {
  diagnosticInput: string;
  feedback?: string;
  rejectedTitles?: string[];
};

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

export type GeneratedPossibility = {
  papel: PossibilityRole;
  titulo: string;
  subtitulo: string;
  naPratica: string;
  entregaPrincipal: string;
  quemPagaria: string;
  comoSeriaRotina: string;
  porQueApareceu: string;
  capacidadesAproveitaveis: string[];
  aprendizagensPrioritarias: string[];
  primeiraVersaoPossivel: string;
  pontoDeAtencao: string;
  familiaValor: string;
  mapaExecucao: MapaExecucao;
};

export type GeneratedPossibilitiesResult = {
  possibilities: GeneratedPossibility[];
  notaDiversidade: string;
};

const ROLE_MAP: Record<string, PossibilityRole> = {
  onde_ja_e_forte: "ONDE_JA_E_FORTE",
  para_onde_quer_ir: "PARA_ONDE_QUER_IR",
  o_que_pode_mobilizar: "O_QUE_PODE_MOBILIZAR",
  como_quer_trabalhar_e_crescer: "COMO_QUER_TRABALHAR_E_CRESCER",
  nao_considerada: "NAO_CONSIDERADA",
};

const PAPEL_VALUES = Object.keys(ROLE_MAP) as [string, ...string[]];

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

const possibilitySchema = z.object({
  papel: z.enum(PAPEL_VALUES),
  titulo: z.string().min(1),
  subtitulo: z.string().min(1),
  na_pratica: z.string().min(1),
  entrega_principal: z.string().min(1),
  quem_pagaria: z.string().min(1),
  como_seria_rotina: z.string().min(1),
  por_que_apareceu: z.string().min(1),
  capacidades_aproveitaveis: z.array(z.string().min(1)).min(2).max(4),
  aprendizagens_prioritarias: z.array(z.string().min(1)).min(1).max(3),
  primeira_versao_possivel: z.string().min(1),
  ponto_de_atencao: z.string().min(1),
  familia_valor: z.string().min(1),
  mapa_execucao: mapaExecucaoSchema,
});

const responseSchema = z.object({
  possibilidades: z.array(possibilitySchema).length(5),
  nota_diversidade: z.string(),
});

const MAPA_EXECUCAO_JSON_SCHEMA = {
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
          entrega_principal: { type: "string" },
          quem_pagaria: { type: "string" },
          como_seria_rotina: { type: "string" },
          por_que_apareceu: { type: "string" },
          capacidades_aproveitaveis: { type: "array", items: { type: "string" } },
          aprendizagens_prioritarias: { type: "array", items: { type: "string" } },
          primeira_versao_possivel: { type: "string" },
          ponto_de_atencao: { type: "string" },
          familia_valor: { type: "string" },
          mapa_execucao: MAPA_EXECUCAO_JSON_SCHEMA,
        },
        required: [
          "papel",
          "titulo",
          "subtitulo",
          "na_pratica",
          "entrega_principal",
          "quem_pagaria",
          "como_seria_rotina",
          "por_que_apareceu",
          "capacidades_aproveitaveis",
          "aprendizagens_prioritarias",
          "primeira_versao_possivel",
          "ponto_de_atencao",
          "familia_valor",
          "mapa_execucao",
        ],
        additionalProperties: false,
      },
    },
    nota_diversidade: { type: "string" },
  },
  required: ["possibilidades", "nota_diversidade"],
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
): Promise<GeneratedPossibilitiesResult> {
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

  return {
    possibilities: parsed.possibilidades.map((p) => ({
      papel: ROLE_MAP[p.papel],
      titulo: p.titulo,
      subtitulo: p.subtitulo,
      naPratica: p.na_pratica,
      entregaPrincipal: p.entrega_principal,
      quemPagaria: p.quem_pagaria,
      comoSeriaRotina: p.como_seria_rotina,
      porQueApareceu: p.por_que_apareceu,
      capacidadesAproveitaveis: p.capacidades_aproveitaveis,
      aprendizagensPrioritarias: p.aprendizagens_prioritarias,
      primeiraVersaoPossivel: p.primeira_versao_possivel,
      pontoDeAtencao: p.ponto_de_atencao,
      familiaValor: p.familia_valor,
      mapaExecucao: {
        objetivoPrincipal: p.mapa_execucao.objetivo_principal,
        resultadoMinimoViavel: p.mapa_execucao.resultado_minimo_viavel,
        esforcoMinimoHoras: p.mapa_execucao.esforco_minimo_horas,
        esforcoRecomendadoHoras: p.mapa_execucao.esforco_recomendado_horas,
        esforcoAvancadoHoras: p.mapa_execucao.esforco_avancado_horas,
        ttfrBaseSemanas: p.mapa_execucao.ttfr_base_semanas,
        competenciasNecessarias: p.mapa_execucao.competencias_necessarias,
        competenciasADesenvolver: p.mapa_execucao.competencias_a_desenvolver,
        acoesEssenciais: p.mapa_execucao.acoes_essenciais,
        nivelComplexidade: p.mapa_execucao.nivel_complexidade,
        principaisDependencias: p.mapa_execucao.principais_dependencias,
        primeiroResultadoObservavel: p.mapa_execucao.primeiro_resultado_observavel,
      },
    })),
    notaDiversidade: parsed.nota_diversidade,
  };
}
