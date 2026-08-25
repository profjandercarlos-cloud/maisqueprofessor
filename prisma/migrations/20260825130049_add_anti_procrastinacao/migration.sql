-- CreateTable
CREATE TABLE "anti_procrastinacao_respostas" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "resposta" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anti_procrastinacao_respostas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "anti_procrastinacao_respostas_planId_itemKey_key" ON "anti_procrastinacao_respostas"("planId", "itemKey");

-- AddForeignKey
ALTER TABLE "anti_procrastinacao_respostas" ADD CONSTRAINT "anti_procrastinacao_respostas_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

