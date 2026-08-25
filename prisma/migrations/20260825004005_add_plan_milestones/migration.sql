-- CreateTable
CREATE TABLE "plan_milestones" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "sequencia" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "achievedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_milestones_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "plan_milestones" ADD CONSTRAINT "plan_milestones_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

