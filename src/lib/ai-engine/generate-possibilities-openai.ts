// Motor V4 das 5 possibilidades — produz um RASCUNHO. Só é persistido
// depois de aprovado (ou corrigido pontualmente e reaprovado) pelo auditor
// semântico (ver audit-possibilities-openai.ts, correct-possibilities-openai.ts
// e run-generation-pipeline.ts). Usa saída estruturada da OpenAI
// (json_schema strict), que garante JSON válido por construção. Diferença
// central pro V3: sem mapa_execucao (gerado só depois da escolha do
// professor, ver generate-mapa-execucao-openai.ts) e com impressão digital
// compacta no lugar da antiga análise interna extensa.
import { z } from "zod";
import type { PossibilityRole } from "@/generated/prisma/client";
import { openai, OPENAI_GENERATION_MODEL } from "./openai-client";
import { GENERATION_SYSTEM_PROMPT } from "./system-prompt";
import type { EntradaEconomica } from "./build-generation-input";
import { logDebugError } from "@/lib/debug-error-log";

export type GenerationContext = {
  diagnosticInput: string;
  entradaEconomica: EntradaEconomica;
  // Feedback do PROFESSOR sobre o conjunto anterior (fluxo de "ajustar
  // conjunto") — não tem mais "instrução de regeneração do auditor" aqui:
  // no V4, uma rejeição do auditor nunca volta pro gerador, só pro corretor
  // pontual (ver correct-possibilities-openai.ts).
  feedback?: string;
  rejectedTitles?: string[];
};

export type ImpressaoDigital = {
  papel: string;
  territorio: string;
  problema: string;
  publico: string;
  pagador: string;
  entrega: string;
  modeloReceita: string;
  evidencias: string[];
  riscoPrincipal: string;
  confiancaComercial: string;
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
  baseNoHistorico: "FORTE" | "MODERADO" | "EXPLORATORIO";
  tempoPrimeiraValidacao: "CURTO_PRAZO" | "MEDIO_PRAZO" | "LONGO_PRAZO";
  horizonteRelevanciaFinanceira: "CURTO_PRAZO" | "MEDIO_PRAZO" | "LONGO_PRAZO" | "A_VALIDAR";
  destaque: boolean;
  comoFunciona: string; // bloco 1 — "A possibilidade"
  comoGerarReceita: string; // bloco 3 — "Como pode gerar receita"
  porQueCombinaComVoce: string; // bloco 2 — "Por que combina com você"
  primeiraValidacao: string; // bloco 4 — "Como validar sem construir tudo"
  pontoDeAtencao: string; // bloco 5 — "Ponto de atenção"
  impressaoDigital: ImpressaoDigital;
  analiseConvergenciaComercial: AnaliseConvergenciaComercial | null;
};

export type Reserva = {
  papel: PossibilityRole;
  territorio: string;
  problema: string;
  publico: string;
  pagador: string;
  entrega: string;
  modeloReceita: string;
  motivoReserva: string;
};

export type MetaFinanceiraUsada = {
  valorMensal: number | null;
  natureza: string;
  prazoDesejado: string | null;
};

export type GeneratedPossibilitiesResult = {
  versaoMotor: string;
  possibilities: GeneratedPossibility[];
  reservas: Reserva[];
  avisoEconomico: string;
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

const LASTRO_MAP: Record<string, "FORTE" | "MODERADO" | "EXPLORATORIO"> = {
  forte: "FORTE",
  moderada: "MODERADO",
  exploratoria: "EXPLORATORIO",
};
const LASTRO_VALUES = Object.keys(LASTRO_MAP) as [string, ...string[]];

const HORIZONTE_MAP: Record<string, "CURTO_PRAZO" | "MEDIO_PRAZO" | "LONGO_PRAZO"> = {
  curto_prazo: "CURTO_PRAZO",
  medio_prazo: "MEDIO_PRAZO",
  longo_prazo: "LONGO_PRAZO",
};
const HORIZONTE_VALUES = Object.keys(HORIZONTE_MAP) as [string, ...string[]];

const HORIZONTE_OU_A_VALIDAR_MAP: Record<string, "CURTO_PRAZO" | "MEDIO_PRAZO" | "LONGO_PRAZO" | "A_VALIDAR"> = {
  ...HORIZONTE_MAP,
  a_validar: "A_VALIDAR",
};
const HORIZONTE_OU_A_VALIDAR_VALUES = Object.keys(HORIZONTE_OU_A_VALIDAR_MAP) as [string, ...string[]];

const impressaoDigitalSchema = z.object({
  papel: z.enum(PAPEL_VALUES),
  territorio: z.string().min(1),
  problema: z.string().min(1),
  publico: z.string().min(1),
  pagador: z.string().min(1),
  entrega: z.string().min(1),
  modelo_receita: z.string().min(1),
  evidencias: z.array(z.string().min(1)).min(1),
  risco_principal: z.string().min(1),
  confianca_comercial: z.enum(LASTRO_VALUES),
});

const analiseConvergenciaComercialSchema = z.object({
  por_que_se_destaca: z.string().min(1),
  horizonte_principal: z.enum(HORIZONTE_OU_A_VALIDAR_VALUES),
  justificativa_horizonte: z.string().min(1),
  logica_para_meta: z.string().min(1),
  conta_de_referencia: z.string().nullable(),
  condicoes_para_confirmar: z.array(z.string().min(1)),
  principal_risco_comercial: z.string().min(1),
  nivel_confianca_comercial: z.enum(LASTRO_VALUES),
});

export const possibilitySchema = z.object({
  ordem: z.number().int(),
  papel: z.enum(PAPEL_VALUES),
  rotulo_papel: z.string().min(1),
  destaque: z.boolean(),
  titulo: z.string().min(1),
  subtitulo: z.string().min(1),
  base_no_historico: z.enum(LASTRO_VALUES),
  tempo_primeira_validacao: z.enum(HORIZONTE_VALUES),
  horizonte_relevancia_financeira: z.enum(HORIZONTE_OU_A_VALIDAR_VALUES),
  a_possibilidade: z.string().min(1),
  por_que_combina_com_voce: z.string().min(1),
  como_gerar_receita: z.string().min(1),
  como_validar: z.string().min(1),
  ponto_de_atencao: z.string().min(1),
  impressao_digital: impressaoDigitalSchema,
  analise_convergencia_comercial: analiseConvergenciaComercialSchema.nullable(),
});

const reservaSchema = z.object({
  papel: z.enum(PAPEL_VALUES),
  territorio: z.string().min(1),
  problema: z.string().min(1),
  publico: z.string().min(1),
  pagador: z.string().min(1),
  entrega: z.string().min(1),
  modelo_receita: z.string().min(1),
  motivo_reserva: z.string().min(1),
});

const metaFinanceiraUsadaSchema = z.object({
  valor_mensal: z.number().nullable(),
  natureza: z.string().min(1),
  prazo_desejado: z.string().nullable(),
});

const responseSchema = z.object({
  versao_motor: z.string().min(1),
  meta_financeira_usada: metaFinanceiraUsadaSchema,
  possibilidades: z.array(possibilitySchema).length(5),
  reservas: z.array(reservaSchema).length(5),
  aviso_economico: z.string().min(1),
});

const IMPRESSAO_DIGITAL_JSON_SCHEMA = {
  type: "object",
  properties: {
    papel: { type: "string", enum: PAPEL_VALUES },
    territorio: { type: "string" },
    problema: { type: "string" },
    publico: { type: "string" },
    pagador: { type: "string" },
    entrega: { type: "string" },
    modelo_receita: { type: "string" },
    evidencias: { type: "array", items: { type: "string" } },
    risco_principal: { type: "string" },
    confianca_comercial: { type: "string", enum: LASTRO_VALUES },
  },
  required: [
    "papel",
    "territorio",
    "problema",
    "publico",
    "pagador",
    "entrega",
    "modelo_receita",
    "evidencias",
    "risco_principal",
    "confianca_comercial",
  ],
  additionalProperties: false,
} as const;

const ANALISE_CONVERGENCIA_COMERCIAL_JSON_SCHEMA = {
  type: ["object", "null"],
  properties: {
    por_que_se_destaca: { type: "string" },
    horizonte_principal: { type: "string", enum: HORIZONTE_OU_A_VALIDAR_VALUES },
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

export const POSSIBILITY_JSON_SCHEMA_PROPERTIES = {
  ordem: { type: "number" },
  papel: { type: "string", enum: PAPEL_VALUES },
  rotulo_papel: { type: "string" },
  destaque: { type: "boolean" },
  titulo: { type: "string" },
  subtitulo: { type: "string" },
  base_no_historico: { type: "string", enum: LASTRO_VALUES },
  tempo_primeira_validacao: { type: "string", enum: HORIZONTE_VALUES },
  horizonte_relevancia_financeira: { type: "string", enum: HORIZONTE_OU_A_VALIDAR_VALUES },
  a_possibilidade: { type: "string" },
  por_que_combina_com_voce: { type: "string" },
  como_gerar_receita: { type: "string" },
  como_validar: { type: "string" },
  ponto_de_atencao: { type: "string" },
  impressao_digital: IMPRESSAO_DIGITAL_JSON_SCHEMA,
  analise_convergencia_comercial: ANALISE_CONVERGENCIA_COMERCIAL_JSON_SCHEMA,
} as const;

export const POSSIBILITY_JSON_SCHEMA_REQUIRED = [
  "ordem",
  "papel",
  "rotulo_papel",
  "destaque",
  "titulo",
  "subtitulo",
  "base_no_historico",
  "tempo_primeira_validacao",
  "horizonte_relevancia_financeira",
  "a_possibilidade",
  "por_que_combina_com_voce",
  "como_gerar_receita",
  "como_validar",
  "ponto_de_atencao",
  "impressao_digital",
  "analise_convergencia_comercial",
] as const;

const RESERVA_JSON_SCHEMA = {
  type: "object",
  properties: {
    papel: { type: "string", enum: PAPEL_VALUES },
    territorio: { type: "string" },
    problema: { type: "string" },
    publico: { type: "string" },
    pagador: { type: "string" },
    entrega: { type: "string" },
    modelo_receita: { type: "string" },
    motivo_reserva: { type: "string" },
  },
  required: ["papel", "territorio", "problema", "publico", "pagador", "entrega", "modelo_receita", "motivo_reserva"],
  additionalProperties: false,
} as const;

const JSON_SCHEMA = {
  type: "object",
  properties: {
    versao_motor: { type: "string" },
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
        properties: POSSIBILITY_JSON_SCHEMA_PROPERTIES,
        required: POSSIBILITY_JSON_SCHEMA_REQUIRED,
        additionalProperties: false,
      },
    },
    reservas: { type: "array", items: RESERVA_JSON_SCHEMA },
    aviso_economico: { type: "string" },
  },
  required: ["versao_motor", "meta_financeira_usada", "possibilidades", "reservas", "aviso_economico"],
  additionalProperties: false,
} as const;

function formatListaOuVazio(items: string[]): string {
  return items.length > 0 ? items.join("; ") : "nenhuma";
}

// Entrada completa (texto do diagnóstico + dados estruturados da Parte
// B1) — usada tanto na mensagem do gerador quanto, sem alteração, como
// "entrada original completa" enviada ao auditor semântico e ao corretor.
export function buildEntradaTexto(diagnosticInput: string, e: EntradaEconomica): string {
  return `${diagnosticInput}

DADOS ESTRUTURADOS ADICIONAIS (Parte B1)
Formas de trabalho selecionadas: ${formatListaOuVazio(e.formasDeTrabalhoSelecionadas)}
Formas de criar valor selecionadas: ${formatListaOuVazio(e.formasDeCriarValorSelecionadas)}
Modelos de remuneração aceitos: ${formatListaOuVazio(e.modelosDeRemuneracaoAceitos)}
Recusas e preferências (o que a pessoa prefere evitar ou não aceita): ${formatListaOuVazio(e.recusasEPreferencias)}
Meta financeira mensal: ${e.metaFinanceiraMensal ?? "não informada"}
Natureza da meta: ${e.naturezaMeta}
Prazo desejado para a meta: ${e.prazoMeta ?? "não informado"}
Públicos acessíveis: ${e.publicosAcessiveis ?? "não informado"}`;
}

function buildUserMessage(context: GenerationContext): string {
  let message = buildEntradaTexto(context.diagnosticInput, context.entradaEconomica);

  if (context.feedback) {
    message += `\n\nFEEDBACK DO PROFESSOR SOBRE O CONJUNTO ANTERIOR:\n${context.feedback}`;
  }
  if (context.rejectedTitles && context.rejectedTitles.length > 0) {
    message += `\n\nPOSSIBILIDADES REJEITADAS ANTERIORMENTE (não repetir):\n${context.rejectedTitles.map((t) => `- ${t}`).join("\n")}`;
  }

  return message;
}

export type GeneratorDraft = z.infer<typeof responseSchema>;

// Extrai todos os identificadores [slug] presentes no texto formatado do
// diagnóstico — usado pra conferir que as evidências citadas pela impressão
// digital de cada possibilidade realmente existem na entrada (checagem
// determinística que antes vivia, em parte, no auditor).
function extractSlugsFromDiagnosticInput(diagnosticInput: string): Set<string> {
  const matches = diagnosticInput.matchAll(/\[([a-z0-9-]+)\]/g);
  return new Set(Array.from(matches, (m) => m[1]));
}

function checkWordCount(label: string, text: string, min: number, max: number, tolerance: number): void {
  const count = text.trim().split(/\s+/).filter(Boolean).length;
  if (count < min - tolerance || count > max + tolerance) {
    logDebugError(
      "generate-possibilities:contagem-de-palavras",
      new Error(`Bloco "${label}" com ${count} palavras, esperado ${min}-${max} (tolerância ${tolerance}).`),
    ).catch(() => {});
  }
}

// Retorna o rascunho cru (validado tecnicamente pelo zod, mas ainda não
// aprovado semanticamente) — quem decide se ele pode virar Possibility de
// verdade é o pipeline (run-generation-pipeline.ts), depois da auditoria.
export async function generatePossibilitiesOpenAI(context: GenerationContext): Promise<GeneratorDraft> {
  const completion = await openai.chat.completions.create({
    model: OPENAI_GENERATION_MODEL,
    max_completion_tokens: 12000,
    messages: [
      { role: "system", content: GENERATION_SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(context) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "possibilidades_v4", strict: true, schema: JSON_SCHEMA },
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
  const destaqueEhQuinta = parsed.possibilidades.every(
    (p) => p.destaque === (p.papel === "maior_convergencia_comercial"),
  );
  if (!destaqueEhQuinta) {
    throw new Error("A possibilidade em destaque não é a de maior convergência comercial.");
  }
  const convergenciaOk = parsed.possibilidades.every((p) =>
    p.papel === "maior_convergencia_comercial"
      ? p.analise_convergencia_comercial !== null
      : p.analise_convergencia_comercial === null,
  );
  if (!convergenciaOk) {
    throw new Error("analise_convergencia_comercial deve ser nula nas 4 primeiras e preenchida só na 5ª.");
  }

  const reservaRoles = new Set(parsed.reservas.map((r) => r.papel));
  if (reservaRoles.size !== 5 || [...reservaRoles].some((r) => !roles.has(r))) {
    throw new Error("As reservas precisam cobrir exatamente os mesmos 5 papéis das possibilidades principais.");
  }

  const slugsValidos = extractSlugsFromDiagnosticInput(context.diagnosticInput);
  for (const p of parsed.possibilidades) {
    const evidenciasInvalidas = p.impressao_digital.evidencias.filter((ev) => {
      const slug = ev.replace(/^\[|\]$/g, "");
      return !slugsValidos.has(slug);
    });
    if (evidenciasInvalidas.length > 0) {
      logDebugError(
        "generate-possibilities:evidencia-invalida",
        new Error(`Papel ${p.papel} cita evidência(s) sem slug correspondente no diagnóstico: ${evidenciasInvalidas.join(", ")}`),
      ).catch(() => {});
    }

    checkWordCount(`${p.papel}:a_possibilidade`, p.a_possibilidade, 30, 45, 15);
    checkWordCount(`${p.papel}:por_que_combina_com_voce`, p.por_que_combina_com_voce, 25, 35, 15);
    checkWordCount(`${p.papel}:como_gerar_receita`, p.como_gerar_receita, 30, 45, 15);
    checkWordCount(`${p.papel}:como_validar`, p.como_validar, 25, 40, 15);
    checkWordCount(`${p.papel}:ponto_de_atencao`, p.ponto_de_atencao, 15, 25, 15);
  }

  return parsed;
}

// Mapeia um item de possibilidade (snake_case, já validado tecnicamente)
// pro shape camelCase usado pra persistir Possibility — reaproveitado tanto
// pelo mapeamento do rascunho completo quanto pela mescla de correções
// pontuais (ver run-generation-pipeline.ts).
export function mapPossibilityToGenerated(p: z.infer<typeof possibilitySchema>): GeneratedPossibility {
  return {
    papel: ROLE_MAP[p.papel],
    titulo: p.titulo,
    subtitulo: p.subtitulo,
    baseNoHistorico: LASTRO_MAP[p.base_no_historico],
    tempoPrimeiraValidacao: HORIZONTE_MAP[p.tempo_primeira_validacao],
    horizonteRelevanciaFinanceira: HORIZONTE_OU_A_VALIDAR_MAP[p.horizonte_relevancia_financeira],
    destaque: p.destaque,
    comoFunciona: p.a_possibilidade,
    comoGerarReceita: p.como_gerar_receita,
    porQueCombinaComVoce: p.por_que_combina_com_voce,
    primeiraValidacao: p.como_validar,
    pontoDeAtencao: p.ponto_de_atencao,
    impressaoDigital: {
      papel: p.impressao_digital.papel,
      territorio: p.impressao_digital.territorio,
      problema: p.impressao_digital.problema,
      publico: p.impressao_digital.publico,
      pagador: p.impressao_digital.pagador,
      entrega: p.impressao_digital.entrega,
      modeloReceita: p.impressao_digital.modelo_receita,
      evidencias: p.impressao_digital.evidencias,
      riscoPrincipal: p.impressao_digital.risco_principal,
      confiancaComercial: p.impressao_digital.confianca_comercial,
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
  };
}

export function mapDraftToResult(draft: GeneratorDraft): GeneratedPossibilitiesResult {
  return {
    versaoMotor: draft.versao_motor,
    possibilities: draft.possibilidades.map(mapPossibilityToGenerated),
    reservas: draft.reservas.map((r) => ({
      papel: ROLE_MAP[r.papel],
      territorio: r.territorio,
      problema: r.problema,
      publico: r.publico,
      pagador: r.pagador,
      entrega: r.entrega,
      modeloReceita: r.modelo_receita,
      motivoReserva: r.motivo_reserva,
    })),
    avisoEconomico: draft.aviso_economico,
    metaFinanceiraUsada: {
      valorMensal: draft.meta_financeira_usada.valor_mensal,
      natureza: draft.meta_financeira_usada.natureza,
      prazoDesejado: draft.meta_financeira_usada.prazo_desejado,
    },
  };
}
