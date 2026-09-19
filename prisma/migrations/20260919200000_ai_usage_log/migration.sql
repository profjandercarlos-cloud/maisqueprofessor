-- Log de tokens por chamada real à OpenAI (2026-09) — pra medir custo por
-- tipo de chamada de verdade, em vez de estimar por proporção do billing.

CREATE TABLE "ai_usage_logs" (
    "id" TEXT NOT NULL,
    "callSite" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "reasoningTokens" INTEGER,
    "totalTokens" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);
