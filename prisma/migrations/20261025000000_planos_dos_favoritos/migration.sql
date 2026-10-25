-- Plano a partir de uma ideia favoritada: o negócio deixa de depender de uma rodada do gerador.
ALTER TYPE "possibility_role" ADD VALUE 'IDEIA_DO_CATALOGO';

ALTER TABLE "possibilities" ALTER COLUMN "roundId" DROP NOT NULL;
ALTER TABLE "possibilities" ADD COLUMN "userId" TEXT;
ALTER TABLE "possibilities" ADD COLUMN "ideiaId" TEXT;

CREATE UNIQUE INDEX "possibilities_userId_ideiaId_key" ON "possibilities"("userId", "ideiaId");

ALTER TABLE "possibilities" ADD CONSTRAINT "possibilities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "possibilities" ADD CONSTRAINT "possibilities_ideiaId_fkey" FOREIGN KEY ("ideiaId") REFERENCES "ideias_negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
