import { db } from "@/lib/db";

type OpenAIUsage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  completion_tokens_details?: { reasoning_tokens?: number };
} | null | undefined;

// Nunca deixa uma falha aqui derrubar o fluxo principal — é só um registro
// auxiliar (mesmo padrão do debug-error-log.ts).
export async function logAiUsage(callSite: string, model: string, usage: OpenAIUsage) {
  if (!usage) return;
  try {
    await db.aiUsageLog.create({
      data: {
        callSite,
        model,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        reasoningTokens: usage.completion_tokens_details?.reasoning_tokens ?? null,
        totalTokens: usage.total_tokens,
      },
    });
  } catch (err) {
    console.error("Falha ao gravar ai_usage_logs", err);
  }
}
