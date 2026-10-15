-- Visibilidade dos Pequenos Negócios por conta: liberação do admin e
-- desbloqueios das contas gratuitas. Puramente aditivo.

ALTER TABLE "pequenos_negocios" ADD COLUMN "liberadoGratuito" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "negocios_desbloqueados" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "negocioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negocios_desbloqueados_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "negocios_desbloqueados_userId_negocioId_key" ON "negocios_desbloqueados"("userId", "negocioId");

ALTER TABLE "negocios_desbloqueados" ADD CONSTRAINT "negocios_desbloqueados_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "negocios_desbloqueados" ADD CONSTRAINT "negocios_desbloqueados_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "pequenos_negocios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
