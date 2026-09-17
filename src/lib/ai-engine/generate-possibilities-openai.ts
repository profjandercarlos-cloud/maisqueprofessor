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

export type ConfiguracaoInterna = {
  territorioProfissional: string;
  mecanismoCentral: string;
  publicoInicial: string;
  grauLastroPublico: string;
  problemaPrincipal: string;
  transformacaoProduzida: string;
  atividadePredominante: string;
  entregaPrincipal: string;
  compradorOuEmpregador: string;
  modeloRemuneracao: string;
  canalInicialAcesso: string;
  distanciaCompetencia: string;
  principalIncerteza: string;
  tipoValidacao: string;
};

export type EvidenciaBase = {
  perguntaId: string;
  tipo: string;
  contribuicao: string;
};

export type ViabilidadeEconomicaInterna = {
  problemaPagavel: string;
  logicaDeValor: string;
  rotaDeEvolucao: string;
  compatibilidadeComMeta: string;
  barreiraDeCredibilidade: string;
  dependenciaDeVolume: string;
  potencialDeRecorrenciaOuEscala: string;
  hipotesesAValidar: string[];
};

export type AnaliseInterna = {
  configuracaoInterna: ConfiguracaoInterna;
  evidenciasBase: EvidenciaBase[];
  viabilidadeEconomicaInterna: ViabilidadeEconomicaInterna;
};

export type AnaliseConvergenciaComercial = {
  porQueSeDestaca: string;
  horizontePrincipal: string;
  justificativaHorizonte: string;
  logicaParaMeta: string;
  contaDeReferencia: string | null;
  condicoesParaConfirmar: string[];
  principalRiscoComercial: string;
  nivelConfiancaComercial: string;
};

export type GeneratedPossibility = {
  papel: PossibilityRole;
  titulo: string;
  subtitulo: string;
  horizonteEconomico: "CURTO_PRAZO" | "MEDIO_PRAZO" | "LONGO_PRAZO";
  nivelLastro: "FORTE" | "MODERADO" | "EXPLORATORIO";
  destaque: boolean;
  comoFunciona: string;
  quemPagariaEComo: string;
  porQueCombinaComVoce: string;
  comoSeriaRotina: string;
  primeiraValidacao: string;
  caminhoEconomico: string;
  pontoDeAtencao: string;
  analiseInterna: AnaliseInterna;
  analiseConvergenciaComercial: AnaliseConvergenciaComercial | null;
  mapaExecucao: MapaExecucao;
};

export type MetaFinanceiraUsada = {
  valorMensal: number | null;
  natureza: string;
  prazoDesejado: string | null;
};

export type GeneratedPossibilitiesResult = {
  possibilities: GeneratedPossibility[];
  notaDiversidade: string;
  avisoEconomico: string;
  dadosAusentesRelevantes: string[];
  metaFinanceiraUsada: MetaFinanceiraUsada;
};

const ROLE_MAP: Record<string, PossibilityRole> = {
  onde_ja_e_forte: "ONDE_JA_E_FORTE",
  para_onde_quer_ir: "PARA_ONDE_QUER_IR",
  o_que_pode_mobilizar: "O_QUE_PODE_MOBILIZAR",
  nao_considerada: "NAO_CONSIDERADA",
  maior_convergencia_comercial: "MAIOR_CONVERGENCIA_COMERCIAL",
};

const PAPEL_VALUES = Object.keys(ROLE_MAP) as [string, ...string[]];

const HORIZONTE_MAP: Record<string, "CURTO_PRAZO" | "MEDIO_PRAZO" | "LONGO_PRAZO"> = {
  curto_prazo: "CURTO_PRAZO",
  medio_prazo: "MEDIO_PRAZO",
  longo_prazo: "LONGO_PRAZO",
};
const HORIZONTE_VALUES = Object.keys(HORIZONTE_MAP) as [string, ...string[]];

const LASTRO_MAP: Record<string, "FORTE" | "MODERADO" | "EXPLORATORIO"> = {
  forte: "FORTE",
  moderado: "MODERADO",
  exploratorio: "EXPLORATORIO",
};
const LASTRO_VALUES = Object.keys(LASTRO_MAP) as [string, ...string[]];

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

const configuracaoInternaSchema = z.object({
  territorio_profissional: z.string().min(1),
  mecanismo_central: z.string().min(1),
  publico_inicial: z.string().min(1),
  grau_lastro_publico: z.string().min(1),
  problema_principal: z.string().min(1),
  transformacao_produzida: z.string().min(1),
  atividade_predominante: z.string().min(1),
  entrega_principal: z.string().min(1),
  comprador_ou_empregador: z.string().min(1),
  modelo_remuneracao: z.string().min(1),
  canal_inicial_acesso: z.string().min(1),
  distancia_competencia: z.string().min(1),
  principal_incerteza: z.string().min(1),
  tipo_validacao: z.string().min(1),
});

const evidenciaBaseSchema = z.object({
  pergunta_id: z.string().min(1),
  tipo: z.string().min(1),
  contribuicao: z.string().min(1),
});

const viabilidadeEconomicaInternaSchema = z.object({
  problema_pagavel: z.string().min(1),
  logica_de_valor: z.string().min(1),
  rota_de_evolucao: z.string().min(1),
  compatibilidade_com_meta: z.string().min(1),
  barreira_de_credibilidade: z.string().min(1),
  dependencia_de_volume: z.string().min(1),
  potencial_de_recorrencia_ou_escala: z.string().min(1),
  hipoteses_a_validar: z.array(z.string().min(1)),
});

const analiseConvergenciaComercialSchema = z.object({
  por_que_se_destaca: z.string().min(1),
  horizonte_principal: z.enum(HORIZONTE_VALUES),
  justificativa_horizonte: z.string().min(1),
  logica_para_meta: z.string().min(1),
  conta_de_referencia: z.string().nullable(),
  condicoes_para_confirmar: z.array(z.string().min(1)),
  principal_risco_comercial: z.string().min(1),
  nivel_confianca_comercial: z.enum(LASTRO_VALUES),
});

const possibilitySchema = z.object({
  ordem: z.number().int(),
  papel: z.enum(PAPEL_VALUES),
  rotulo_papel: z.string().min(1),
  destaque: z.boolean(),
  titulo: z.string().min(1),
  subtitulo: z.string().min(1),
  horizonte_economico: z.enum(HORIZONTE_VALUES),
  nivel_lastro: z.enum(LASTRO_VALUES),
  como_funciona: z.string().min(1),
  quem_pagaria_e_como: z.string().min(1),
  por_que_combina_com_voce: z.string().min(1),
  como_seria_a_rotina: z.string().min(1),
  primeira_validacao: z.string().min(1),
  caminho_economico: z.string().min(1),
  ponto_de_atencao: z.string().min(1),
  configuracao_interna: configuracaoInternaSchema,
  evidencias_base: z.array(evidenciaBaseSchema).min(2).max(4),
  viabilidade_economica_interna: viabilidadeEconomicaInternaSchema,
  analise_convergencia_comercial: analiseConvergenciaComercialSchema.nullable(),
  mapa_execucao: mapaExecucaoSchema,
});

const metaFinanceiraUsadaSchema = z.object({
  valor_mensal: z.number().nullable(),
  natureza: z.string().min(1),
  prazo_desejado: z.string().nullable(),
});

const responseSchema = z.object({
  meta_financeira_usada: metaFinanceiraUsadaSchema,
  possibilidades: z.array(possibilitySchema).length(5),
  nota_diversidade: z.string(),
  aviso_economico: z.string().min(1),
  dados_ausentes_relevantes: z.array(z.string().min(1)),
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

const CONFIGURACAO_INTERNA_JSON_SCHEMA = {
  type: "object",
  properties: {
    territorio_profissional: { type: "string" },
    mecanismo_central: { type: "string" },
    publico_inicial: { type: "string" },
    grau_lastro_publico: { type: "string" },
    problema_principal: { type: "string" },
    transformacao_produzida: { type: "string" },
    atividade_predominante: { type: "string" },
    entrega_principal: { type: "string" },
    comprador_ou_empregador: { type: "string" },
    modelo_remuneracao: { type: "string" },
    canal_inicial_acesso: { type: "string" },
    distancia_competencia: { type: "string" },
    principal_incerteza: { type: "string" },
    tipo_validacao: { type: "string" },
  },
  required: [
    "territorio_profissional",
    "mecanismo_central",
    "publico_inicial",
    "grau_lastro_publico",
    "problema_principal",
    "transformacao_produzida",
    "atividade_predominante",
    "entrega_principal",
    "comprador_ou_empregador",
    "modelo_remuneracao",
    "canal_inicial_acesso",
    "distancia_competencia",
    "principal_incerteza",
    "tipo_validacao",
  ],
  additionalProperties: false,
} as const;

const EVIDENCIA_BASE_JSON_SCHEMA = {
  type: "object",
  properties: {
    pergunta_id: { type: "string" },
    tipo: { type: "string" },
    contribuicao: { type: "string" },
  },
  required: ["pergunta_id", "tipo", "contribuicao"],
  additionalProperties: false,
} as const;

const VIABILIDADE_ECONOMICA_INTERNA_JSON_SCHEMA = {
  type: "object",
  properties: {
    problema_pagavel: { type: "string" },
    logica_de_valor: { type: "string" },
    rota_de_evolucao: { type: "string" },
    compatibilidade_com_meta: { type: "string" },
    barreira_de_credibilidade: { type: "string" },
    dependencia_de_volume: { type: "string" },
    potencial_de_recorrencia_ou_escala: { type: "string" },
    hipoteses_a_validar: { type: "array", items: { type: "string" } },
  },
  required: [
    "problema_pagavel",
    "logica_de_valor",
    "rota_de_evolucao",
    "compatibilidade_com_meta",
    "barreira_de_credibilidade",
    "dependencia_de_volume",
    "potencial_de_recorrencia_ou_escala",
    "hipoteses_a_validar",
  ],
  additionalProperties: false,
} as const;

const ANALISE_CONVERGENCIA_COMERCIAL_JSON_SCHEMA = {
  type: ["object", "null"],
  properties: {
    por_que_se_destaca: { type: "string" },
    horizonte_principal: { type: "string", enum: HORIZONTE_VALUES },
    justificativa_horizonte: { type: "string" },
    logica_para_meta: { type: "string" },
    conta_de_referencia: { type: ["string", "null"] },
    condicoes_para_confirmar: { type: "array", items: { type: "string" } },
    principal_risco_comercial: { type: "string" },
    nivel_confianca_comercial: { type: "string", enum: LASTRO_VALUES },
  },
  required: [
    "por_que_se_destaca",
    "horizonte_principal",
    "justificativa_horizonte",
    "logica_para_meta",
    "conta_de_referencia",
    "condicoes_para_confirmar",
    "principal_risco_comercial",
    "nivel_confianca_comercial",
  ],
  additionalProperties: false,
} as const;

const JSON_SCHEMA = {
  type: "object",
  properties: {
    meta_financeira_usada: {
      type: "object",
      properties: {
        valor_mensal: { type: ["number", "null"] },
        natureza: { type: "string" },
        prazo_desejado: { type: ["string", "null"] },
      },
      required: ["valor_mensal", "natureza", "prazo_desejado"],
      additionalProperties: false,
    },
    possibilidades: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ordem: { type: "number" },
          papel: { type: "string", enum: PAPEL_VALUES },
          rotulo_papel: { type: "string" },
          destaque: { type: "boolean" },
          titulo: { type: "string" },
          subtitulo: { type: "string" },
          horizonte_economico: { type: "string", enum: HORIZONTE_VALUES },
          nivel_lastro: { type: "string", enum: LASTRO_VALUES },
          como_funciona: { type: "string" },
          quem_pagaria_e_como: { type: "string" },
          por_que_combina_com_voce: { type: "string" },
          como_seria_a_rotina: { type: "string" },
          primeira_validacao: { type: "string" },
          caminho_economico: { type: "string" },
          ponto_de_atencao: { type: "string" },
          configuracao_interna: CONFIGURACAO_INTERNA_JSON_SCHEMA,
          evidencias_base: { type: "array", items: EVIDENCIA_BASE_JSON_SCHEMA },
          viabilidade_economica_interna: VIABILIDADE_ECONOMICA_INTERNA_JSON_SCHEMA,
          analise_convergencia_comercial: ANALISE_CONVERGENCIA_COMERCIAL_JSON_SCHEMA,
          mapa_execucao: MAPA_EXECUCAO_JSON_SCHEMA,
        },
        required: [
          "ordem",
          "papel",
          "rotulo_papel",
          "destaque",
          "titulo",
          "subtitulo",
          "horizonte_economico",
          "nivel_lastro",
          "como_funciona",
          "quem_pagaria_e_como",
          "por_que_combina_com_voce",
          "como_seria_a_rotina",
          "primeira_validacao",
          "caminho_economico",
          "ponto_de_atencao",
          "configuracao_interna",
          "evidencias_base",
          "viabilidade_economica_interna",
          "analise_convergencia_comercial",
          "mapa_execucao",
        ],
        additionalProperties: false,
      },
    },
    nota_diversidade: { type: "string" },
    aviso_economico: { type: "string" },
    dados_ausentes_relevantes: { type: "array", items: { type: "string" } },
  },
  required: [
    "meta_financeira_usada",
    "possibilidades",
    "nota_diversidade",
    "aviso_economico",
    "dados_ausentes_relevantes",
  ],
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

  const destaqueCount = parsed.possibilidades.filter((p) => p.destaque).length;
  if (destaqueCount !== 1) {
    throw new Error("O modelo retornou uma quantidade de possibilidades em destaque diferente de 1.");
  }

  return {
    possibilities: parsed.possibilidades.map((p) => ({
      papel: ROLE_MAP[p.papel],
      titulo: p.titulo,
      subtitulo: p.subtitulo,
      horizonteEconomico: HORIZONTE_MAP[p.horizonte_economico],
      nivelLastro: LASTRO_MAP[p.nivel_lastro],
      destaque: p.destaque,
      comoFunciona: p.como_funciona,
      quemPagariaEComo: p.quem_pagaria_e_como,
      porQueCombinaComVoce: p.por_que_combina_com_voce,
      comoSeriaRotina: p.como_seria_a_rotina,
      primeiraValidacao: p.primeira_validacao,
      caminhoEconomico: p.caminho_economico,
      pontoDeAtencao: p.ponto_de_atencao,
      analiseInterna: {
        configuracaoInterna: {
          territorioProfissional: p.configuracao_interna.territorio_profissional,
          mecanismoCentral: p.configuracao_interna.mecanismo_central,
          publicoInicial: p.configuracao_interna.publico_inicial,
          grauLastroPublico: p.configuracao_interna.grau_lastro_publico,
          problemaPrincipal: p.configuracao_interna.problema_principal,
          transformacaoProduzida: p.configuracao_interna.transformacao_produzida,
          atividadePredominante: p.configuracao_interna.atividade_predominante,
          entregaPrincipal: p.configuracao_interna.entrega_principal,
          compradorOuEmpregador: p.configuracao_interna.comprador_ou_empregador,
          modeloRemuneracao: p.configuracao_interna.modelo_remuneracao,
          canalInicialAcesso: p.configuracao_interna.canal_inicial_acesso,
          distanciaCompetencia: p.configuracao_interna.distancia_competencia,
          principalIncerteza: p.configuracao_interna.principal_incerteza,
          tipoValidacao: p.configuracao_interna.tipo_validacao,
        },
        evidenciasBase: p.evidencias_base.map((e) => ({
          perguntaId: e.pergunta_id,
          tipo: e.tipo,
          contribuicao: e.contribuicao,
        })),
        viabilidadeEconomicaInterna: {
          problemaPagavel: p.viabilidade_economica_interna.problema_pagavel,
          logicaDeValor: p.viabilidade_economica_interna.logica_de_valor,
          rotaDeEvolucao: p.viabilidade_economica_interna.rota_de_evolucao,
          compatibilidadeComMeta: p.viabilidade_economica_interna.compatibilidade_com_meta,
          barreiraDeCredibilidade: p.viabilidade_economica_interna.barreira_de_credibilidade,
          dependenciaDeVolume: p.viabilidade_economica_interna.dependencia_de_volume,
          potencialDeRecorrenciaOuEscala: p.viabilidade_economica_interna.potencial_de_recorrencia_ou_escala,
          hipotesesAValidar: p.viabilidade_economica_interna.hipoteses_a_validar,
        },
      },
      analiseConvergenciaComercial: p.analise_convergencia_comercial
        ? {
            porQueSeDestaca: p.analise_convergencia_comercial.por_que_se_destaca,
            horizontePrincipal: p.analise_convergencia_comercial.horizonte_principal,
            justificativaHorizonte: p.analise_convergencia_comercial.justificativa_horizonte,
            logicaParaMeta: p.analise_convergencia_comercial.logica_para_meta,
            contaDeReferencia: p.analise_convergencia_comercial.conta_de_referencia,
            condicoesParaConfirmar: p.analise_convergencia_comercial.condicoes_para_confirmar,
            principalRiscoComercial: p.analise_convergencia_comercial.principal_risco_comercial,
            nivelConfiancaComercial: p.analise_convergencia_comercial.nivel_confianca_comercial,
          }
        : null,
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
    avisoEconomico: parsed.aviso_economico,
    dadosAusentesRelevantes: parsed.dados_ausentes_relevantes,
    metaFinanceiraUsada: {
      valorMensal: parsed.meta_financeira_usada.valor_mensal,
      natureza: parsed.meta_financeira_usada.natureza,
      prazoDesejado: parsed.meta_financeira_usada.prazo_desejado,
    },
  };
}
