import { openai } from "./openai-client";
import { logAiUsage } from "./log-ai-usage";

// "Luna": nível rápido e econômico. Aqui a IA só lê as respostas e devolve um resumo curto para a
// pessoa conferir; não gera negócios nem conselho, então não precisa do modelo maior.
const MODELO_DA_REVISAO = "gpt-5.6-luna";

export type ResumoDaRevisao = {
  /** 3 a 4 frases, em segunda pessoa, com o que foi entendido da pessoa. */
  entendi: string[];
  /** Como a meta financeira e o prazo foram lidos; null quando a pessoa não informou. */
  meta: string | null;
  /** Respostas abertas que parecem não responder ao que a pergunta pediu. */
  pontosFracos: { slug: string; motivo: string }[];
};

const SYSTEM_PROMPT = `Você ajuda uma pessoa (em geral professor ou professora) a conferir as respostas de um diagnóstico profissional ANTES de elas serem usadas para gerar sugestões de negócio. Você NÃO sugere negócios, carreiras nem conselhos. Responda em português do Brasil, em JSON no formato pedido.

1. "entendi": de 3 a 4 frases curtas, em segunda pessoa ("Você..."), com o que você entendeu da pessoa a partir das respostas: o que ela já fez e faz, as capacidades que aparecem, o que ela quer da vida profissional e o que ela não quer. Use só o que está nas respostas, com as palavras da própria pessoa sempre que possível. Não invente setor, experiência nem preferência. Não elogie.

2. "meta": uma frase dizendo como você leu a meta financeira e o prazo (exemplo: "R$ 4.000 a R$ 6.000 por mês, líquidos, em até 12 meses"). Se a meta não foi informada, use null. Se estiver ambígua (não dá para saber se é por mês, bruto ou líquido), diga a leitura mais provável e que vale confirmar.

3. "pontosFracos": até 3 respostas abertas que NÃO respondem ao que a pergunta pediu: falam de outra coisa, só de qualidades, só de desejos, só de aulas quando a pergunta é sobre fora da sala, ou só de cursos e vídeos como se fossem experiência. Use apenas os slugs permitidos, que aparecem entre colchetes antes de cada pergunta. Em "motivo", escreva uma frase gentil, em segunda pessoa, dizendo o que a pergunta pede e o que faltou. Se as respostas estão adequadas, devolva uma lista vazia. Nunca aponte uma resposta só por ser curta ou simples.

Nunca use travessão. Escreva frases diretas.`;

const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["entendi", "meta", "pontosFracos"],
  properties: {
    entendi: { type: "array", items: { type: "string" } },
    meta: { type: ["string", "null"] },
    pontosFracos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["slug", "motivo"],
        properties: { slug: { type: "string" }, motivo: { type: "string" } },
      },
    },
  },
} as const;

function limpar(texto: string): string {
  return texto.replace(/\s*[—–]\s*/g, ", ").replace(/\s+/g, " ").trim();
}

// `entrada` é o mesmo texto que o gerador recebe (formatDiagnosticInput). `slugsPermitidos` são as
// perguntas abertas, as únicas que podem ser apontadas como fracas.
export async function resumirDiagnosticoOpenAI(entrada: string, slugsPermitidos: string[]): Promise<ResumoDaRevisao> {
  const completion = await openai.chat.completions.create(
    {
      model: MODELO_DA_REVISAO,
      max_completion_tokens: 3000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Slugs permitidos em "pontosFracos": ${slugsPermitidos.join(", ")}\n\nRESPOSTAS DA PESSOA:\n${entrada}` },
      ],
      response_format: { type: "json_schema", json_schema: { name: "revisao_do_diagnostico", strict: true, schema: JSON_SCHEMA } },
    },
    { timeout: 40_000, maxRetries: 1 },
  );
  await logAiUsage("revisao-diagnostico", MODELO_DA_REVISAO, completion.usage);

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Resposta da OpenAI (revisão do diagnóstico) não contém texto.");
  const bruto = JSON.parse(content) as ResumoDaRevisao;

  const permitidos = new Set(slugsPermitidos);
  const vistos = new Set<string>();
  return {
    entendi: (Array.isArray(bruto.entendi) ? bruto.entendi : []).map(limpar).filter(Boolean).slice(0, 4),
    meta: typeof bruto.meta === "string" && limpar(bruto.meta) ? limpar(bruto.meta) : null,
    pontosFracos: (Array.isArray(bruto.pontosFracos) ? bruto.pontosFracos : [])
      .filter((p) => permitidos.has(p.slug) && limpar(p.motivo) && !vistos.has(p.slug) && vistos.add(p.slug))
      .map((p) => ({ slug: p.slug, motivo: limpar(p.motivo) }))
      .slice(0, 3),
  };
}
