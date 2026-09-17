-- Limpa possibilidades PENDENTE (mesmo padrão já usado nas rodadas
-- anteriores) — a única linha que resta é a APROVADA de
-- jandercarlos@uol.com.br, com Plano ATIVO.
DELETE FROM "possibilities" WHERE "status" = 'PENDENTE';

-- CreateEnum
CREATE TYPE "generation_round_status" AS ENUM ('PROCESSANDO', 'PRONTO', 'FALHOU');

-- AlterEnum
ALTER TYPE "horizonte_economico" ADD VALUE 'A_VALIDAR';

-- AlterTable: generation_rounds
ALTER TABLE "generation_rounds" DROP COLUMN "dadosAusentesRelevantes";
ALTER TABLE "generation_rounds"
  ADD COLUMN     "status" "generation_round_status" NOT NULL DEFAULT 'PRONTO',
  ADD COLUMN     "versaoMotor" TEXT;
-- A partir de agora, o código sempre escreve o status explicitamente na
-- criação (PROCESSANDO); o DEFAULT 'PRONTO' acima é só pro backfill da
-- linha histórica existente.
ALTER TABLE "generation_rounds" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "generation_rounds" ALTER COLUMN "status" SET DEFAULT 'PROCESSANDO';

-- AlterTable: possibilities (renomeia + adiciona)
ALTER TABLE "possibilities" RENAME COLUMN "horizonteEconomico" TO "tempoPrimeiraValidacao";
ALTER TABLE "possibilities" RENAME COLUMN "nivelLastro" TO "baseNoHistorico";
ALTER TABLE "possibilities"
  ADD COLUMN     "horizonteRelevanciaFinanceira" "horizonte_economico" NOT NULL DEFAULT 'MEDIO_PRAZO';
