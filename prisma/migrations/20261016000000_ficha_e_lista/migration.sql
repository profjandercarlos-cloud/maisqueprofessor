-- Ficha do professor e "Minha lista". Puramente aditivo.

ALTER TABLE "pequenos_negocios" ADD COLUMN "ficha" JSONB;
ALTER TABLE "pequenos_negocios" ADD COLUMN "fichaGeradaEm" TIMESTAMP(3);

CREATE TABLE "negocios_na_lista" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negocios_na_lista_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "negocios_na_lista_userId_negocioId_key" ON "negocios_na_lista"("userId", "negocioId");

ALTER TABLE "negocios_na_lista" ADD CONSTRAINT "negocios_na_lista_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "negocios_na_lista" ADD CONSTRAINT "negocios_na_lista_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "pequenos_negocios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
