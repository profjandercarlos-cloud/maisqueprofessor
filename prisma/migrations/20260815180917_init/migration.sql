-- CreateEnum
CREATE TYPE "intention" AS ENUM ('SAIR', 'COMPLEMENTAR', 'NAO_SEI');

-- CreateEnum
CREATE TYPE "diagnostic_status" AS ENUM ('EM_ANDAMENTO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "possibility_role" AS ENUM ('ONDE_JA_E_FORTE', 'PARA_ONDE_QUER_IR', 'O_QUE_PODE_MOBILIZAR', 'COMO_QUER_TRABALHAR_E_CRESCER', 'NAO_CONSIDERADA');

-- CreateEnum
CREATE TYPE "possibility_status" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA');

-- CreateEnum
CREATE TYPE "plan_status" AS ENUM ('ATIVO', 'PAUSADO', 'CONGELADO');

-- CreateEnum
CREATE TYPE "profundidade" AS ENUM ('EXPLORACAO', 'TESTE_REAL', 'MERGULHO');

-- CreateEnum
CREATE TYPE "week_status" AS ENUM ('PENDENTE', 'CONCLUIDA', 'ATRASADA');

-- CreateEnum
CREATE TYPE "obstacle_category" AS ENUM ('FALTA_DE_TEMPO', 'FALTA_DE_INVESTIMENTO', 'DIFICULDADE_TECNICA', 'FALTA_DE_MOTIVACAO', 'INSEGURANCA_OU_MEDO', 'IMPREVISTO_PESSOAL_OU_EXTERNO', 'NAO_HOUVE_OBSTACULO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "accessExpiresAt" TIMESTAMP(3),
    "accessRevokedAt" TIMESTAMP(3),
    "checkinWeekday" INTEGER,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifyPush" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "intention" "intention" NOT NULL,
    "answers" JSONB NOT NULL,
    "incrementAnswers" JSONB,
    "status" "diagnostic_status" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnostics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_rounds" (
    "id" TEXT NOT NULL,
    "diagnosticId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "feedbackText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "possibilities" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "papel" "possibility_role" NOT NULL,
    "titulo" TEXT NOT NULL,
    "subtitulo" TEXT NOT NULL,
    "naPratica" TEXT NOT NULL,
    "porQueApareceu" TEXT NOT NULL,
    "quemPagaria" TEXT NOT NULL,
    "jaPossuiVsAprender" TEXT NOT NULL,
    "familiaValor" TEXT NOT NULL,
    "status" "possibility_status" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "possibilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "possibilityId" TEXT NOT NULL,
    "status" "plan_status" NOT NULL DEFAULT 'ATIVO',
    "tempoDisponivelHoras" DOUBLE PRECISION NOT NULL,
    "investimentoFaixa" TEXT NOT NULL,
    "profundidade" "profundidade" NOT NULL,
    "acompanhamento" TEXT,
    "diaCheckin" INTEGER NOT NULL,
    "relatorio" JSONB NOT NULL,
    "duracaoSemanas" INTEGER NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pausedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_weeks" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "meta" TEXT NOT NULL,
    "tasks" JSONB NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "status" "week_status" NOT NULL DEFAULT 'PENDENTE',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkins" (
    "id" TEXT NOT NULL,
    "planWeekId" TEXT NOT NULL,
    "doneItems" TEXT NOT NULL,
    "notDoneItems" TEXT NOT NULL,
    "obstacleCategory" "obstacle_category" NOT NULL,
    "freeText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_guidance" (
    "id" TEXT NOT NULL,
    "checkinId" TEXT NOT NULL,
    "baseTipText" TEXT NOT NULL,
    "personalizedText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execution_guidance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "planWeekId" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotmart_transactions" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "userId" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotmart_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "generation_rounds_diagnosticId_roundNumber_key" ON "generation_rounds"("diagnosticId", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "plans_possibilityId_key" ON "plans"("possibilityId");

-- CreateIndex
CREATE UNIQUE INDEX "plan_weeks_planId_weekNumber_key" ON "plan_weeks"("planId", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "checkins_planWeekId_key" ON "checkins"("planWeekId");

-- CreateIndex
CREATE UNIQUE INDEX "execution_guidance_checkinId_key" ON "execution_guidance"("checkinId");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_planWeekId_key" ON "journal_entries"("planWeekId");

-- CreateIndex
CREATE UNIQUE INDEX "hotmart_transactions_transactionId_key" ON "hotmart_transactions"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- AddForeignKey
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_rounds" ADD CONSTRAINT "generation_rounds_diagnosticId_fkey" FOREIGN KEY ("diagnosticId") REFERENCES "diagnostics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "possibilities" ADD CONSTRAINT "possibilities_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "generation_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_possibilityId_fkey" FOREIGN KEY ("possibilityId") REFERENCES "possibilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_weeks" ADD CONSTRAINT "plan_weeks_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_planWeekId_fkey" FOREIGN KEY ("planWeekId") REFERENCES "plan_weeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_guidance" ADD CONSTRAINT "execution_guidance_checkinId_fkey" FOREIGN KEY ("checkinId") REFERENCES "checkins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_planWeekId_fkey" FOREIGN KEY ("planWeekId") REFERENCES "plan_weeks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotmart_transactions" ADD CONSTRAINT "hotmart_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
