import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Sonnet para geração de conteúdo novo (motor das 5 possibilidades);
// Haiku (claude-haiku-4-5-20251001) fica reservado para a personalização
// restrita do check-in semanal (Etapa 8) — nunca usar Sonnet ali, é
// desnecessariamente caro para uma reescrita de tom.
export const GENERATION_MODEL = "claude-sonnet-5";
