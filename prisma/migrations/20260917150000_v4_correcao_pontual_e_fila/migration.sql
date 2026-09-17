-- Limpa rascunhos de teste (mesmo padrão de sempre) antes de mexer no shape da tabela.
DELETE FROM "possibilities" WHERE "status" = 'PENDENTE';

-- Novos valores de status (cada um em sua própria alteração de tipo — nenhum é usado no
-- resto desta migração, restrição do Postgres para ALTER TYPE ... ADD VALUE dentro da
-- mesma transação). PROCESSANDO e PRONTO ficam no enum como legado (motor V3).
ALTER TYPE "generation_round_status" ADD VALUE 'PENDENTE';
ALTER TYPE "generation_round_status" ADD VALUE 'GERANDO';
ALTER TYPE "generation_round_status" ADD VALUE 'VALIDANDO';
ALTER TYPE "generation_round_status" ADD VALUE 'CORRIGINDO';
ALTER TYPE "generation_round_status" ADD VALUE 'CONCLUIDO';

-- GenerationRound: estado intermediário entre fases da fila + updatedAt (detecta rodada travada).
ALTER TABLE "generation_rounds"
  ADD COLUMN "rascunhoAtual" JSONB,
  ADD COLUMN "auditoriaAtual" JSONB,
  ADD COLUMN "correcaoTentada" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- notaDiversidade não existe mais (auditor V4 não reporta nota solta).
ALTER TABLE "generation_rounds" DROP COLUMN "notaDiversidade";

-- avisoEconomico/metaFinanceiraUsada só são preenchidos quando o round chega a CONCLUIDO.
ALTER TABLE "generation_rounds" ALTER COLUMN "avisoEconomico" DROP NOT NULL;
ALTER TABLE "generation_rounds" ALTER COLUMN "metaFinanceiraUsada" DROP NOT NULL;

-- Possibility: 7 blocos de texto viram 5 (funde quemPagariaEComo+caminhoEconomico, remove comoSeriaRotina).
ALTER TABLE "possibilities" RENAME COLUMN "quemPagariaEComo" TO "comoGerarReceita";
ALTER TABLE "possibilities" DROP COLUMN "caminhoEconomico";
ALTER TABLE "possibilities" DROP COLUMN "comoSeriaRotina";

-- analiseInterna (configuracao_interna + evidencias_base + viabilidade_economica_interna,
-- ~30 campos) vira impressaoDigital (impressão digital semântica compacta, ~10 campos).
ALTER TABLE "possibilities" RENAME COLUMN "analiseInterna" TO "impressaoDigital";
