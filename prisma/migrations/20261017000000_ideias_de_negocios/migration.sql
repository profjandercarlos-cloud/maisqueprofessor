-- Ideias de negócios para professores (novo repositório) e favoritos.
-- Puramente aditivo: as tabelas antigas (pequenos_negocios etc.) ficam como legado.

CREATE TABLE "ideias_negocio" (
    "id" TEXT NOT NULL,
    "origemId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "resumo" TEXT NOT NULL,
    "dados" JSONB NOT NULL,
    "conteudo" JSONB NOT NULL,
    "status" "caminho_renda_status" NOT NULL DEFAULT 'PENDENTE_REVISAO',
    "notaRevisao" TEXT,
    "conteudoEditadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ideias_negocio_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ideias_negocio_origemId_key" ON "ideias_negocio"("origemId");
CREATE UNIQUE INDEX "ideias_negocio_slug_key" ON "ideias_negocio"("slug");

CREATE TABLE "ideias_favoritas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ideiaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ideias_favoritas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ideias_favoritas_userId_ideiaId_key" ON "ideias_favoritas"("userId", "ideiaId");

ALTER TABLE "ideias_favoritas" ADD CONSTRAINT "ideias_favoritas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ideias_favoritas" ADD CONSTRAINT "ideias_favoritas_ideiaId_fkey" FOREIGN KEY ("ideiaId") REFERENCES "ideias_negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
