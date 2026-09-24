// Motor V5 "macro nicho" das 5 possibilidades — produz um RASCUNHO. Só é
// persistido depois de aprovado (ou corrigido pontualmente e reaprovado)
// pelo auditor semântico (ver audit-possibilities-openai.ts,
// correct-possibilities-openai.ts e run-generation-pipeline.ts). Usa saída
// estruturada da OpenAI (json_schema strict).
//
// Diferença central pro V4: identifica o macro nicho da pessoa antes das 5
// possibilidades, e cada possibilidade já nasce com conexão de mercado real
// + trajetória financeira de 1/3/5 anos embutidas (a antiga camada
// "analiseMercadoAmpliada", gerada numa fase separada depois, não é mais
// necessária — ver nota no schema.prisma). `comoGerarReceita`/`comoValidar`
// continuam existindo como resumos internos curtos, pra não quebrar Mapa de
// Execução / Etapa de Especificação / Plano, que ainda leem esses campos.
import { z } from "zod";
import type { Possibility, PossibilityRole } from "@/generated/prisma/client";
import { openai, OPENAI_GENERATION_MODEL } from "./openai-client";
import { GENERATION_SYSTEM_PROMPT } from "./system-prompt";
import type { EntradaEconomica } from "./build-generation-input";
import { logDebugError } from "@/lib/debug-error-log";
import { logAiUsage } from "./log-ai-usage";

export type GenerationContext = {
  diagnosticInput: string;
  entradaEconomica: EntradaEconomica;
  feedback?: string;
  rejectedTitles?: string[];
  territoriosJaTentados?: Array<{
    territorio: string;
    problema: string;
    entrega: string;
    modeloReceita: string;
  }>;
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

export type ConexaoMundoReal = {
  nomeDeMercado: string | null;
  reconhecimentoMercado: string;
  compradoresNomeados: string[];
};

export type MarcoTemporalFinanceiro = {
  premissas: string;
  resultadoLiquidoEstimado: string;
};

export type TrajetoriaFinanceira = {
  cenarioInicial: MarcoTemporalFinanceiro;
  ano1: MarcoTemporalFinanceiro;
  ano3: MarcoTemporalFinanceiro;
  ano5: MarcoTemporalFinanceiro;
  logicaDeCrescimento: string;
  riscoEstrutural: string;
  aviso: string;
};

export type TempoDedicacao = {
  inicial: string;
  ano3: string;
  ano5: string;
};

export type MacroNicho = {
  nome: string;
  explicacao: string;
  nichoSecundario: string | null;
};

export type GeneratedPossibility = {
  papel: PossibilityRole;
  titulo: string;
  subtitulo: string;
  baseNoHistorico: "FORTE" | "MODERADO" | "EXPLORATORIO";
  tempoPrimeiraValidacao: "CURTO_PRAZO" | "MEDIO_PRAZO" | "LONGO_PRAZO";
  horizonteRelevanciaFinanceira: "CURTO_PRAZO" | "MEDIO_PRAZO" | "LONGO_PRAZO" | "A_VALIDAR";
  destaque: boolean;
  comoFunciona: string; // bloco 1 — "A possibilidade" (já com exemplo concreto embutido)
  comoGerarReceita: string; // resumo interno curto — usado por Mapa de Execução/Etapa de Especificação/Plano
  porQueCombinaComVoce: string;
  primeiraValidacao: string; // resumo interno curto ("como validar")
  pontoDeAtencao: string;
  dominioAplicacao: string;
  mecanismoComercialClasse: string;
  profundidade: string;
  impressaoDigital: ImpressaoDigital;
  conexaoMundoReal: ConexaoMundoReal;
  trajetoriaFinanceira: TrajetoriaFinanceira;
  tempoDedicacao: TempoDedicacao;
  analiseConvergenciaComercial: null; // não é mais usado no V5 — destaque financeiro vive em trajetoriaFinanceira
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
  macroNicho: MacroNicho;
  premissasFinanceirasGerais: string;
  possibilities: GeneratedPossibility[];
  reservas: Reserva[];
  avisoEconomico: string;
  metaFinanceiraUsada: MetaFinanceiraUsada;
};

export const ROLE_MAP: Record<string, PossibilityRole> = {
  onde_ja_e_forte: "ONDE_JA_E_FORTE",
  para_onde_quer_ir: "PARA_ONDE_QUER_IR",
  o_que_pode_mobilizar: "O_QUE_PODE_MOBILIZAR",
  nao_considerada: "NAO_CONSIDERADA",
  // O papel manteve o mesmo valor de enum no banco (evita migração/risco) —
  // só o nome exibido pro professor mudou, via `rotulo_papel` (texto livre
  // já gerado pelo próprio modelo, não o enum).
  maior_chance_sucesso_financeiro: "MAIOR_CONVERGENCIA_COMERCIAL",
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

function inverso<T extends string>(map: Record<string, T>): Record<T, string> {
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k])) as Record<T, string>;
}
const LASTRO_MAP_INVERSO = inverso(LASTRO_MAP);
const HORIZONTE_MAP_INVERSO = inverso(HORIZONTE_MAP);
const HORIZONTE_OU_A_VALIDAR_MAP_INVERSO = inverso(HORIZONTE_OU_A_VALIDAR_MAP);

const MECANISMO_COMERCIAL_VALUES = [
  "servico_projeto",
  "produto_digital",
  "software_recorrente",
  "intermediacao",
  "operacao_recorrente",
  "conteudo",
] as const;

const PROFUNDIDADE_VALUES = ["diagnostico_pontual", "acompanhamento_recorrente", "uso_autonomo"] as const;

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

const conexaoMundoRealSchema = z.object({
  nome_de_mercado: z.string().nullable(),
  reconhecimento_mercado: z.string().min(1),
  compradores_nomeados: z.array(z.string().min(1)).min(1).max(5),
});

const marcoTemporalSchema = z.object({
  premissas: z.string().min(1),
  resultado_liquido_estimado: z.string().min(1),
});

const trajetoriaFinanceiraSchema = z.object({
  cenario_inicial: marcoTemporalSchema,
  ano_1: marcoTemporalSchema,
  ano_3: marcoTemporalSchema,
  ano_5: marcoTemporalSchema,
  logica_de_crescimento: z.string().min(1),
  risco_estrutural: z.string().min(1),
  aviso: z.string().min(1),
});

const tempoDedicacaoSchema = z.object({
  inicial: z.string().min(1),
  ano_3: z.string().min(1),
  ano_5: z.string().min(1),
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
  dominio_aplicacao: z.string().min(1),
  mecanismo_comercial_classe: z.enum(MECANISMO_COMERCIAL_VALUES),
  profundidade: z.enum(PROFUNDIDADE_VALUES),
  impressao_digital: impressaoDigitalSchema,
  conexao_mundo_real: conexaoMundoRealSchema,
  trajetoria_financeira: trajetoriaFinanceiraSchema,
  tempo_dedicacao: tempoDedicacaoSchema,
  analise_convergencia_comercial: z.null(),
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

const macroNichoSchema = z.object({
  nome: z.string().min(1),
  explicacao: z.string().min(1),
  nicho_secundario: z.string().nullable(),
});

const responseSchema = z.object({
  versao_motor: z.string().min(1),
  macro_nicho: macroNichoSchema,
  premissas_financeiras_gerais: z.string().min(1),
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

const CONEXAO_MUNDO_REAL_JSON_SCHEMA = {
  type: "object",
  properties: {
    nome_de_mercado: { type: ["string", "null"] },
    reconhecimento_mercado: { type: "string" },
    compradores_nomeados: { type: "array", items: { type: "string" } },
  },
  required: ["nome_de_mercado", "reconhecimento_mercado", "compradores_nomeados"],
  additionalProperties: false,
} as const;

const MARCO_TEMPORAL_JSON_SCHEMA = {
  type: "object",
  properties: {
    premissas: { type: "string", description: "Conta em base MENSAL (volume mensal × preço, custos mensais) — nunca some 12 meses." },
    resultado_liquido_estimado: { type: "string", description: "Resultado líquido MENSAL estimado para este marco — nunca um total anual." },
  },
  required: ["premissas", "resultado_liquido_estimado"],
  additionalProperties: false,
} as const;

const TRAJETORIA_FINANCEIRA_JSON_SCHEMA = {
  type: "object",
  properties: {
    cenario_inicial: MARCO_TEMPORAL_JSON_SCHEMA,
    ano_1: MARCO_TEMPORAL_JSON_SCHEMA,
    ano_3: MARCO_TEMPORAL_JSON_SCHEMA,
    ano_5: MARCO_TEMPORAL_JSON_SCHEMA,
    logica_de_crescimento: { type: "string" },
    risco_estrutural: { type: "string" },
    aviso: { type: "string" },
  },
  required: ["cenario_inicial", "ano_1", "ano_3", "ano_5", "logica_de_crescimento", "risco_estrutural", "aviso"],
  additionalProperties: false,
} as const;

const TEMPO_DEDICACAO_JSON_SCHEMA = {
  type: "object",
  properties: {
    inicial: { type: "string" },
    ano_3: { type: "string" },
    ano_5: { type: "string" },
  },
  required: ["inicial", "ano_3", "ano_5"],
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
  dominio_aplicacao: { type: "string" },
  mecanismo_comercial_classe: { type: "string", enum: MECANISMO_COMERCIAL_VALUES },
  profundidade: { type: "string", enum: PROFUNDIDADE_VALUES },
  impressao_digital: IMPRESSAO_DIGITAL_JSON_SCHEMA,
  conexao_mundo_real: CONEXAO_MUNDO_REAL_JSON_SCHEMA,
  trajetoria_financeira: TRAJETORIA_FINANCEIRA_JSON_SCHEMA,
  tempo_dedicacao: TEMPO_DEDICACAO_JSON_SCHEMA,
  analise_convergencia_comercial: { type: "null" },
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
  "dominio_aplicacao",
  "mecanismo_comercial_classe",
  "profundidade",
  "impressao_digital",
  "conexao_mundo_real",
  "trajetoria_financeira",
  "tempo_dedicacao",
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

const MACRO_NICHO_JSON_SCHEMA = {
  type: "object",
  properties: {
    nome: { type: "string", description: "Nome curto (2-5 palavras), como uma identidade — nunca uma frase longa descrevendo o mecanismo." },
    explicacao: { type: "string", description: "Cite a situação concreta de cada evidência pelo nome, não abstraia (ex.: \"a obra da própria casa\", não \"planejamento com controle financeiro\")." },
    nicho_secundario: { type: ["string", "null"] },
  },
  required: ["nome", "explicacao", "nicho_secundario"],
  additionalProperties: false,
} as const;

const JSON_SCHEMA = {
  type: "object",
  properties: {
    versao_motor: { type: "string" },
    macro_nicho: MACRO_NICHO_JSON_SCHEMA,
    premissas_financeiras_gerais: { type: "string" },
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
  required: [
    "versao_motor",
    "macro_nicho",
    "premissas_financeiras_gerais",
    "meta_financeira_usada",
    "possibilidades",
    "reservas",
    "aviso_economico",
  ],
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
  if (context.territoriosJaTentados && context.territoriosJaTentados.length > 0) {
    message += `\n\nTERRITÓRIOS_JÁ_TENTADOS (conteúdo de rodadas anteriores para esta mesma pessoa — não repetir com nome diferente, ver B10):\n${context.territoriosJaTentados
      .map(
        (t, i) =>
          `${i + 1}. território: ${t.territorio} | problema: ${t.problema} | entrega: ${t.entrega} | modelo de receita: ${t.modeloReceita}`,
      )
      .join("\n")}`;
  }

  return message;
}

export type GeneratorDraft = z.infer<typeof responseSchema>;

// Extrai todos os identificadores [slug] presentes no texto formatado do
// diagnóstico — usado pra conferir que as evidências citadas pela impressão
// digital de cada possibilidade realmente existem na entrada.
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
    max_completion_tokens: 20000,
    messages: [
      { role: "system", content: GENERATION_SYSTEM_PROMPT },
      { role: "user", content: buildUserMessage(context) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "possibilidades_v5", strict: true, schema: JSON_SCHEMA },
    },
  });
  await logAiUsage("generate-possibilities", OPENAI_GENERATION_MODEL, completion.usage);

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
    (p) => p.destaque === (p.papel === "maior_chance_sucesso_financeiro"),
  );
  if (!destaqueEhQuinta) {
    throw new Error("A possibilidade em destaque não é a de maior chance de sucesso financeiro.");
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

    checkWordCount(`${p.papel}:como_gerar_receita`, p.como_gerar_receita, 30, 45, 15);
    checkWordCount(`${p.papel}:como_validar`, p.como_validar, 25, 40, 15);
    checkWordCount(`${p.papel}:por_que_combina_com_voce`, p.por_que_combina_com_voce, 25, 45, 15);
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
    dominioAplicacao: p.dominio_aplicacao,
    mecanismoComercialClasse: p.mecanismo_comercial_classe,
    profundidade: p.profundidade,
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
    conexaoMundoReal: {
      nomeDeMercado: p.conexao_mundo_real.nome_de_mercado,
      reconhecimentoMercado: p.conexao_mundo_real.reconhecimento_mercado,
      compradoresNomeados: p.conexao_mundo_real.compradores_nomeados,
    },
    trajetoriaFinanceira: {
      cenarioInicial: {
        premissas: p.trajetoria_financeira.cenario_inicial.premissas,
        resultadoLiquidoEstimado: p.trajetoria_financeira.cenario_inicial.resultado_liquido_estimado,
      },
      ano1: {
        premissas: p.trajetoria_financeira.ano_1.premissas,
        resultadoLiquidoEstimado: p.trajetoria_financeira.ano_1.resultado_liquido_estimado,
      },
      ano3: {
        premissas: p.trajetoria_financeira.ano_3.premissas,
        resultadoLiquidoEstimado: p.trajetoria_financeira.ano_3.resultado_liquido_estimado,
      },
      ano5: {
        premissas: p.trajetoria_financeira.ano_5.premissas,
        resultadoLiquidoEstimado: p.trajetoria_financeira.ano_5.resultado_liquido_estimado,
      },
      logicaDeCrescimento: p.trajetoria_financeira.logica_de_crescimento,
      riscoEstrutural: p.trajetoria_financeira.risco_estrutural,
      aviso: p.trajetoria_financeira.aviso,
    },
    tempoDedicacao: {
      inicial: p.tempo_dedicacao.inicial,
      ano3: p.tempo_dedicacao.ano_3,
      ano5: p.tempo_dedicacao.ano_5,
    },
    analiseConvergenciaComercial: null,
  };
}

const ROLE_MAP_INVERSO_PARA_ORDEM: Record<string, number> = Object.fromEntries(
  PAPEL_VALUES.map((snake, i) => [ROLE_MAP[snake], i + 1]),
);

// Inverso de mapPossibilityToGenerated — reconstrói o formato do rascunho
// (snake_case, o que a IA produz e o que o corretor espera em `mantidas`) a
// partir de uma Possibility já persistida no banco. Usado pelo ajuste
// seletivo (run-generation-pipeline.ts:startSelectiveAdjustment) pra
// garantir que "mantidas" sempre reflita o que está de fato salvo, mesmo se
// o `rascunhoAtual` da rodada tiver ficado desatualizado por uma correção
// anterior que não chegou a ser persistida (ex.: falha no meio da promoção
// de reserva). `rotulo_papel` não é persistido em lugar nenhum (nunca é lido
// depois da geração — a UI usa o rótulo fixo de role-meta.tsx), então
// reaproveita o título como placeholder inofensivo.
export function mapPossibilityRowToDraft(p: Possibility): z.infer<typeof possibilitySchema> {
  const papelSnake = PAPEL_VALUES.find((snake) => ROLE_MAP[snake] === p.papel);
  if (!papelSnake) throw new Error(`Papel desconhecido ao reconstruir rascunho: ${p.papel}`);

  const impressao = p.impressaoDigital as unknown as {
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
  const conexao = p.conexaoMundoReal as unknown as {
    nomeDeMercado: string | null;
    reconhecimentoMercado: string;
    compradoresNomeados: string[];
  };
  const trajetoria = p.trajetoriaFinanceira as unknown as {
    cenarioInicial: { premissas: string; resultadoLiquidoEstimado: string };
    ano1: { premissas: string; resultadoLiquidoEstimado: string };
    ano3: { premissas: string; resultadoLiquidoEstimado: string };
    ano5: { premissas: string; resultadoLiquidoEstimado: string };
    logicaDeCrescimento: string;
    riscoEstrutural: string;
    aviso: string;
  };
  const tempo = p.tempoDedicacao as unknown as { inicial: string; ano3: string; ano5: string };

  return {
    ordem: ROLE_MAP_INVERSO_PARA_ORDEM[p.papel],
    papel: papelSnake,
    rotulo_papel: p.titulo,
    destaque: p.destaque,
    titulo: p.titulo,
    subtitulo: p.subtitulo,
    base_no_historico: LASTRO_MAP_INVERSO[p.baseNoHistorico],
    tempo_primeira_validacao: (HORIZONTE_MAP_INVERSO as Record<string, string>)[p.tempoPrimeiraValidacao],
    horizonte_relevancia_financeira: HORIZONTE_OU_A_VALIDAR_MAP_INVERSO[p.horizonteRelevanciaFinanceira],
    a_possibilidade: p.comoFunciona,
    por_que_combina_com_voce: p.porQueCombinaComVoce,
    como_gerar_receita: p.comoGerarReceita,
    como_validar: p.primeiraValidacao,
    ponto_de_atencao: p.pontoDeAtencao,
    dominio_aplicacao: p.dominioAplicacao ?? "",
    mecanismo_comercial_classe: p.mecanismoComercialClasse as z.infer<typeof possibilitySchema>["mecanismo_comercial_classe"],
    profundidade: p.profundidade as z.infer<typeof possibilitySchema>["profundidade"],
    impressao_digital: {
      papel: impressao.papel,
      territorio: impressao.territorio,
      problema: impressao.problema,
      publico: impressao.publico,
      pagador: impressao.pagador,
      entrega: impressao.entrega,
      modelo_receita: impressao.modeloReceita,
      evidencias: impressao.evidencias,
      risco_principal: impressao.riscoPrincipal,
      confianca_comercial: impressao.confiancaComercial as z.infer<typeof possibilitySchema>["impressao_digital"]["confianca_comercial"],
    },
    conexao_mundo_real: {
      nome_de_mercado: conexao.nomeDeMercado,
      reconhecimento_mercado: conexao.reconhecimentoMercado,
      compradores_nomeados: conexao.compradoresNomeados,
    },
    trajetoria_financeira: {
      cenario_inicial: {
        premissas: trajetoria.cenarioInicial.premissas,
        resultado_liquido_estimado: trajetoria.cenarioInicial.resultadoLiquidoEstimado,
      },
      ano_1: { premissas: trajetoria.ano1.premissas, resultado_liquido_estimado: trajetoria.ano1.resultadoLiquidoEstimado },
      ano_3: { premissas: trajetoria.ano3.premissas, resultado_liquido_estimado: trajetoria.ano3.resultadoLiquidoEstimado },
      ano_5: { premissas: trajetoria.ano5.premissas, resultado_liquido_estimado: trajetoria.ano5.resultadoLiquidoEstimado },
      logica_de_crescimento: trajetoria.logicaDeCrescimento,
      risco_estrutural: trajetoria.riscoEstrutural,
      aviso: trajetoria.aviso,
    },
    tempo_dedicacao: { inicial: tempo.inicial, ano_3: tempo.ano3, ano_5: tempo.ano5 },
    analise_convergencia_comercial: null,
  };
}

export function mapDraftToResult(draft: GeneratorDraft): GeneratedPossibilitiesResult {
  return {
    versaoMotor: draft.versao_motor,
    macroNicho: {
      nome: draft.macro_nicho.nome,
      explicacao: draft.macro_nicho.explicacao,
      nichoSecundario: draft.macro_nicho.nicho_secundario,
    },
    premissasFinanceirasGerais: draft.premissas_financeiras_gerais,
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
