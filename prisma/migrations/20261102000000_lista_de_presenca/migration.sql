-- Lista de presença: banco de dicas, reações das pessoas, presenças diárias e controle de lotes.
CREATE TYPE "dica_origem" AS ENUM ('MANUAL', 'IA');
CREATE TYPE "dica_status" AS ENUM ('ATIVA', 'APOSENTADA');
CREATE TYPE "dica_reacao_tipo" AS ENUM ('GUARDADA', 'JA_FACO', 'NAO_E_PARA_MIM');
CREATE TYPE "dica_lote_status" AS ENUM ('EM_ANDAMENTO', 'CONCLUIDO', 'FALHOU');

CREATE TABLE "dicas" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "tenteHoje" TEXT NOT NULL,
    "ideia" TEXT,
    "origem" "dica_origem" NOT NULL DEFAULT 'MANUAL',
    "lote" INTEGER NOT NULL DEFAULT 0,
    "status" "dica_status" NOT NULL DEFAULT 'ATIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dicas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dica_reacoes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dicaId" TEXT NOT NULL,
    "tipo" "dica_reacao_tipo" NOT NULL,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dica_reacoes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "presencas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dia" DATE NOT NULL,
    "dicaId" TEXT,
    "mensagemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presencas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dica_lotes" (
    "id" SERIAL NOT NULL,
    "status" "dica_lote_status" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "erro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "dica_lotes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "dicas_chave_key" ON "dicas"("chave");
CREATE UNIQUE INDEX "dica_reacoes_userId_dicaId_key" ON "dica_reacoes"("userId", "dicaId");
CREATE UNIQUE INDEX "presencas_userId_dia_key" ON "presencas"("userId", "dia");

ALTER TABLE "dica_reacoes" ADD CONSTRAINT "dica_reacoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dica_reacoes" ADD CONSTRAINT "dica_reacoes_dicaId_fkey" FOREIGN KEY ("dicaId") REFERENCES "dicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "presencas" ADD CONSTRAINT "presencas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "presencas" ADD CONSTRAINT "presencas_dicaId_fkey" FOREIGN KEY ("dicaId") REFERENCES "dicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
