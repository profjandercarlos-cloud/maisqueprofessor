-- Plano por ações (sem semanas): status, orientações e checklist por ação.
-- Puramente aditivo: PlanWeek/PlanTask/Checkin ficam como legado.

CREATE TYPE "acao_status" AS ENUM ('A_FAZER', 'EM_ANDAMENTO', 'CONCLUIDA');

ALTER TABLE "plan_acoes" ADD COLUMN "status" "acao_status" NOT NULL DEFAULT 'A_FAZER';
ALTER TABLE "plan_acoes" ADD COLUMN "concluidaEm" TIMESTAMP(3);
ALTER TABLE "plan_acoes" ADD COLUMN "orientacoes" JSONB;

CREATE TABLE "plan_acao_itens" (
    "id" TEXT NOT NULL,
    "acaoId" TEXT NOT NULL,
    "sequencia" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "feito" BOOLEAN NOT NULL DEFAULT false,
    "feitoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_acao_itens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plan_acao_itens_acaoId_sequencia_key" ON "plan_acao_itens"("acaoId", "sequencia");

ALTER TABLE "plan_acao_itens" ADD CONSTRAINT "plan_acao_itens_acaoId_fkey" FOREIGN KEY ("acaoId") REFERENCES "plan_acoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
