-- Missões de Ativação — Bloco 0 da rota, entre a adequação e o Plano de
-- Execução Personalizado.

CREATE TYPE "missao_tipo" AS ENUM ('CAPACIDADE', 'REALIDADE', 'VALIDACAO');
CREATE TYPE "missao_conclusao" AS ENUM ('TOTAL', 'PARCIAL', 'NAO');

ALTER TABLE "possibilities" ADD COLUMN "feedbackMissoesAtivacao" JSONB;

CREATE TABLE "missoes_ativacao" (
    "id" TEXT NOT NULL,
    "possibilityId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "tipo" "missao_tipo" NOT NULL,
    "nome" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "porQueExiste" TEXT NOT NULL,
    "tempoEstimadoMinutos" INTEGER NOT NULL,
    "recursosNecessarios" TEXT NOT NULL,
    "passoAPasso" JSONB NOT NULL,
    "criterioConclusao" TEXT NOT NULL,
    "evidenciaEsperada" TEXT NOT NULL,
    "perguntaReflexao" TEXT NOT NULL,
    "conseguiuConcluir" "missao_conclusao",
    "tempoRealMinutos" INTEGER,
    "oQueAconteceu" TEXT,
    "reflexao" TEXT,
    "respondidoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "missoes_ativacao_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "missoes_ativacao_possibilityId_ordem_key" ON "missoes_ativacao"("possibilityId", "ordem");

ALTER TABLE "missoes_ativacao" ADD CONSTRAINT "missoes_ativacao_possibilityId_fkey" FOREIGN KEY ("possibilityId") REFERENCES "possibilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
