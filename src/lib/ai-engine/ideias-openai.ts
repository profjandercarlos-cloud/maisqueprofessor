import { z } from "zod";
import { openai, OPENAI_GENERATION_MODEL } from "./openai-client";
import { IDEIAS_SYSTEM_PROMPT } from "./ideias-prompt";
import { logAiUsage } from "./log-ai-usage";
import { aplicarTextos, textosDoConteudo, type ConteudoIdeia, type TextosIdeia } from "@/lib/ideias/conteudo";

const texto = z.string().min(1);

const textosSchema = z.object({
  resumo: texto,
  empresaFaz: z.object({ descricao: texto, exemplo: texto, focoLucratividade: texto }),
  porqueAtencao: z.array(texto).min(1).max(4),
  primeiroServico: z.object({ oferta: texto, plano: texto, observacaoEscopo: texto.nullable() }),
  cincoAnos: z.object({ marcos: z.array(texto).min(1).max(5), estrutura: texto, premissas: texto }),
});

const str = { type: "string" } as const;

const JSON_SCHEMA = {
  type: "object",
  properties: {
    resumo: str,
    empresaFaz: {
      type: "object",
      properties: { descricao: str, exemplo: str, focoLucratividade: str },
      required: ["descricao", "exemplo", "focoLucratividade"],
      additionalProperties: false,
    },
    porqueAtencao: { type: "array", items: str },
    primeiroServico: {
      type: "object",
      properties: { oferta: str, plano: str, observacaoEscopo: { type: ["string", "null"] } },
      required: ["oferta", "plano", "observacaoEscopo"],
      additionalProperties: false,
    },
    cincoAnos: {
      type: "object",
      properties: { marcos: { type: "array", items: str }, estrutura: str, premissas: str },
      required: ["marcos", "estrutura", "premissas"],
      additionalProperties: false,
    },
  },
  required: ["resumo", "empresaFaz", "porqueAtencao", "primeiroServico", "cincoAnos"],
  additionalProperties: false,
} as const;

// Sem `conteudoAtual`: reescreve os textos do zero a partir dos dados originais.
// Com `conteudoAtual`: modo ajuste — muda só o que a observação pede.
// Em ambos, a IA devolve só texto; os números vêm da base (aplicarTextos).
export async function reescreverIdeiaOpenAI(args: {
  dados: unknown;
  base: ConteudoIdeia; // fornece nome, horas e simulação (intocáveis)
  conteudoAtual?: ConteudoIdeia;
  observacao?: string;
}): Promise<ConteudoIdeia> {
  const { dados, base, conteudoAtual, observacao } = args;

  // Fontes ficam de fora: o texto não cita links nem as usa como prova de valor.
  const { fontes: _fontes, ...dadosSemFontes } = (dados ?? {}) as Record<string, unknown>;
  void _fontes;

  const partes = [`DADOS ORIGINAIS\n${JSON.stringify(dadosSemFontes, null, 1)}`];
  if (conteudoAtual) {
    partes.push(
      `CONTEÚDO ATUAL (já revisado; modo de ajuste: mude só o que a observação pede)\n${JSON.stringify(textosDoConteudo(conteudoAtual), null, 1)}`,
    );
  }
  if (observacao?.trim()) {
    partes.push(
      `OBSERVAÇÃO DO REVISOR${conteudoAtual ? " (aplique somente isto)" : " (siga ao escrever)"}:\n${observacao.trim()}`,
    );
  }

  const completion = await openai.chat.completions.create({
    model: OPENAI_GENERATION_MODEL,
    max_completion_tokens: 6000,
    messages: [
      { role: "system", content: IDEIAS_SYSTEM_PROMPT },
      { role: "user", content: partes.join("\n\n") },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "textos_ideia", strict: true, schema: JSON_SCHEMA },
    },
  });
  await logAiUsage("reescrever-ideia-negocio", OPENAI_GENERATION_MODEL, completion.usage);

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Resposta da OpenAI (ideia de negócio) não contém texto.");

  const textos: TextosIdeia = textosSchema.parse(JSON.parse(content));
  return aplicarTextos(conteudoAtual ?? base, textos);
}
