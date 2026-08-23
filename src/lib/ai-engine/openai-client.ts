import OpenAI from "openai";

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// "Terra" é o nível equilibrado (custo x velocidade) da família GPT-5.6,
// recomendado pra geração estruturada de alto volume — nem o mais caro/lento
// (Sol), nem o mais raso (Luna).
export const OPENAI_GENERATION_MODEL = "gpt-5.6-terra";
