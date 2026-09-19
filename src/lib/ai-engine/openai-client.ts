import OpenAI from "openai";

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// "Sol" é o nível mais lento e caro da família GPT-5.6, escolhido depois de
// testar os dois lado a lado no motor "macro nicho": gerou conexão com o
// mercado e identificação do macro nicho consistentemente melhores que
// "Terra" (nível equilibrado), com custo ~2x maior. Compensado reduzindo pra
// 1 a quantidade de rodadas de ajuste disponíveis (ver MAX_ADJUSTMENT_ROUNDS
// em diagnostico/possibilidades/[roundId]/page.tsx).
export const OPENAI_GENERATION_MODEL = "gpt-5.6-sol";
