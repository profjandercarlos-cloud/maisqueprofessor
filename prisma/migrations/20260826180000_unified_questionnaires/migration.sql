-- CreateEnum
CREATE TYPE "rota_profissional" AS ENUM ('CARREIRA', 'CRIACAO_VALOR', 'EXPLORACAO');

-- CreateEnum
CREATE TYPE "nivel_acompanhamento" AS ENUM ('MINIMO', 'MEDIO', 'ALTO');

-- CreateEnum
CREATE TYPE "orcamento_faixa" AS ENUM ('SEM_INVESTIMENTO', 'ATE_300', 'DE_300_A_1000', 'ACIMA_DE_1000');

-- CreateEnum
CREATE TYPE "estagio_inicial" AS ENUM ('NUNCA_FIZ', 'PESQUISEI_NAO_EXECUTEI', 'FIZ_ISOLADO', 'TENHO_CASO_PORTFOLIO', 'ATUO_PARCIALMENTE');

-- CreateEnum
CREATE TYPE "distribuicao_tempo" AS ENUM ('BLOCO_UNICO', 'BLOCOS_MEDIOS', 'SESSOES_CURTAS', 'AGENDA_VARIAVEL');

-- CreateEnum
CREATE TYPE "regra_seguranca_financeira" AS ENUM ('MANTER_RENDA_INTEGRAL', 'SEM_COMPROMISSO_ANTES_EVIDENCIA', 'TRANSICAO_GRADUAL', 'MARGEM_PARA_DEDICAR', 'NAO_SE_APLICA');

-- CreateEnum
CREATE TYPE "equilibrio_aprender_executar" AS ENUM ('FOCO_EXECUCAO', 'EQUILIBRADO', 'FOCO_APRENDIZADO', 'SISTEMA_RECOMENDA');

-- CreateEnum
CREATE TYPE "acao_aceita" AS ENUM ('PESQUISAR', 'CONVERSAR', 'PRODUZIR_AMOSTRA', 'PUBLICAR_CONTEUDO', 'ENVIAR_CANDIDATURAS', 'PROPOSTA_COMERCIAL', 'PILOTO_REMUNERADO', 'ATIVIDADE_PRESENCIAL', 'PREPARAR_PRIVADAMENTE');

-- AlterEnum
ALTER TYPE "intention" ADD VALUE 'JA_FORA_DA_SALA';

-- AlterTable: diagnostics
ALTER TABLE "diagnostics" ADD COLUMN     "rotaProfissional" "rota_profissional",
ADD COLUMN     "versaoQuestionario" TEXT NOT NULL DEFAULT 'descoberta_v1';

-- AlterTable: plan_tasks
ALTER TABLE "plan_tasks" ADD COLUMN     "opcional" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: plans — colunas novas, adicionadas como nullable pra poder
-- fazer backfill dos 4 planos já existentes antes de travar como NOT NULL.
-- Esses planos já foram gerados (relatorio/semanas/tarefas são imutáveis
-- depois de criados), então o valor de backfill não afeta o conteúdo já
-- entregue — só evita quebrar código futuro que leia essas colunas.
ALTER TABLE "plans" ADD COLUMN     "acoesAceitas" "acao_aceita"[],
ADD COLUMN     "classificacaoEncaixe" TEXT,
ADD COLUMN     "condicaoAdicionalExecucao" TEXT,
ADD COLUMN     "distribuicaoTempo" "distribuicao_tempo",
ADD COLUMN     "equilibrioAprenderExecutar" "equilibrio_aprender_executar",
ADD COLUMN     "estagioInicial" "estagio_inicial",
ADD COLUMN     "horasNucleoSemana" DOUBLE PRECISION,
ADD COLUMN     "regraSegurancaFinanceira" "regra_seguranca_financeira";

-- Backfill dos planos pré-existentes.
UPDATE "plans" SET
  "distribuicaoTempo" = 'BLOCOS_MEDIOS',
  "equilibrioAprenderExecutar" = 'EQUILIBRADO',
  "estagioInicial" = 'PESQUISEI_NAO_EXECUTEI',
  "regraSegurancaFinanceira" = 'NAO_SE_APLICA',
  "horasNucleoSemana" = LEAST("tempoDisponivelHoras", 10)
WHERE "distribuicaoTempo" IS NULL;

ALTER TABLE "plans" ALTER COLUMN "distribuicaoTempo" SET NOT NULL;
ALTER TABLE "plans" ALTER COLUMN "equilibrioAprenderExecutar" SET NOT NULL;
ALTER TABLE "plans" ALTER COLUMN "estagioInicial" SET NOT NULL;
ALTER TABLE "plans" ALTER COLUMN "regraSegurancaFinanceira" SET NOT NULL;
ALTER TABLE "plans" ALTER COLUMN "horasNucleoSemana" SET NOT NULL;

-- investimentoFaixa: os valores em texto já batem exatamente com os
-- valores do novo enum (SEM_INVESTIMENTO, ATE_300, DE_300_A_1000,
-- ACIMA_DE_1000), então o cast direto preserva os dados sem perda.
ALTER TABLE "plans" ALTER COLUMN "investimentoFaixa" TYPE "orcamento_faixa" USING "investimentoFaixa"::"orcamento_faixa";

-- acompanhamento: os valores antigos são o rótulo completo em português
-- ("Mínimo — só o check-in..."), não o código do novo enum — precisa
-- mapear pelo prefixo antes de converter o tipo da coluna.
ALTER TABLE "plans" ALTER COLUMN "acompanhamento" TYPE "nivel_acompanhamento" USING (
  CASE
    WHEN "acompanhamento" LIKE 'Mínimo%' THEN 'MINIMO'
    WHEN "acompanhamento" LIKE 'Médio%' THEN 'MEDIO'
    WHEN "acompanhamento" LIKE 'Alto%' THEN 'ALTO'
    ELSE NULL
  END
)::"nivel_acompanhamento";

-- CreateTable
CREATE TABLE "adequacao_responses" (
    "id" TEXT NOT NULL,
    "possibilityId" TEXT NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "status" "diagnostic_status" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "versaoQuestionario" TEXT NOT NULL DEFAULT 'adequacao_v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adequacao_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "adequacao_responses_possibilityId_key" ON "adequacao_responses"("possibilityId");

-- AddForeignKey
ALTER TABLE "adequacao_responses" ADD CONSTRAINT "adequacao_responses_possibilityId_fkey" FOREIGN KEY ("possibilityId") REFERENCES "possibilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS lockdown (mesmo padrão aplicado às demais tabelas novas do projeto)
REVOKE ALL PRIVILEGES ON TABLE "adequacao_responses" FROM anon, authenticated;
ALTER TABLE "adequacao_responses" ENABLE ROW LEVEL SECURITY;
