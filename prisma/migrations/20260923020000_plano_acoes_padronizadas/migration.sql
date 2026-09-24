-- Ações padronizadas do plano (5-8 por plano) — unidade narrativa
-- principal, agrupando 1+ semanas reais. Puramente aditivo: nova tabela +
-- coluna nullable em plan_weeks, nenhum dado existente é afetado.

CREATE TABLE "plan_acoes" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "sequencia" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "escopoMinimo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_acoes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plan_acoes_planId_sequencia_key" ON "plan_acoes"("planId", "sequencia");

ALTER TABLE "plan_acoes" ADD CONSTRAINT "plan_acoes_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "plan_weeks" ADD COLUMN "planAcaoId" TEXT;
ALTER TABLE "plan_weeks" ADD CONSTRAINT "plan_weeks_planAcaoId_fkey" FOREIGN KEY ("planAcaoId") REFERENCES "plan_acoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
