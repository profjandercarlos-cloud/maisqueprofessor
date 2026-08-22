-- CreateEnum
CREATE TYPE "task_status" AS ENUM ('PENDENTE', 'COMPLETO', 'PARCIAL');

-- CreateEnum
CREATE TYPE "task_origin" AS ENUM ('PLANO', 'PROPRIA', 'PENDENCIA');

-- AlterTable
ALTER TABLE "checkins" DROP COLUMN "doneItems",
DROP COLUMN "notDoneItems";

-- AlterTable
ALTER TABLE "plan_weeks" DROP COLUMN "tasks",
ADD COLUMN     "dificuldadesAntecipadas" TEXT;

-- AlterTable
ALTER TABLE "plans" DROP COLUMN "profundidade";

-- DropEnum
DROP TYPE "profundidade";

-- CreateTable
CREATE TABLE "plan_tasks" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "planWeekId" TEXT,
    "texto" TEXT NOT NULL,
    "horasEstimadas" DOUBLE PRECISION NOT NULL,
    "status" "task_status" NOT NULL DEFAULT 'PENDENTE',
    "origin" "task_origin" NOT NULL DEFAULT 'PLANO',
    "notaParcial" TEXT,
    "sequencia" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_tasks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "plan_tasks" ADD CONSTRAINT "plan_tasks_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_tasks" ADD CONSTRAINT "plan_tasks_planWeekId_fkey" FOREIGN KEY ("planWeekId") REFERENCES "plan_weeks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

