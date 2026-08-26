-- CreateEnum
CREATE TYPE "milestone_tipo" AS ENUM ('ENTREGA_CONTROLAVEL', 'SINAL_EXTERNO');

-- AlterTable
ALTER TABLE "plan_milestones" ADD COLUMN     "tipo" "milestone_tipo" NOT NULL DEFAULT 'ENTREGA_CONTROLAVEL';
