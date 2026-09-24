-- Substitui as Missões de Ativação (capacidade/realidade/validação fixas)
-- pela Etapa de Especificação (1-4 ações, geradas por dimensão em aberto:
-- público/problema/formato/evidência). Renomeia a tabela e o enum de tipo
-- em vez de criar do zero, já que o formato da ação em si não muda.

DELETE FROM "missoes_ativacao";

ALTER TABLE "missoes_ativacao" RENAME TO "acoes_especificacao";
ALTER TABLE "acoes_especificacao" RENAME CONSTRAINT "missoes_ativacao_pkey" TO "acoes_especificacao_pkey";
ALTER TABLE "acoes_especificacao" RENAME CONSTRAINT "missoes_ativacao_possibilityId_fkey" TO "acoes_especificacao_possibilityId_fkey";
ALTER INDEX "missoes_ativacao_possibilityId_ordem_key" RENAME TO "acoes_especificacao_possibilityId_ordem_key";

ALTER TABLE "acoes_especificacao" RENAME COLUMN "tipo" TO "dimensao";

CREATE TYPE "dimensao_especificacao" AS ENUM ('PUBLICO', 'PROBLEMA', 'FORMATO', 'EVIDENCIA');
ALTER TABLE "acoes_especificacao" ALTER COLUMN "dimensao" TYPE "dimensao_especificacao" USING ("dimensao"::text::"dimensao_especificacao");
DROP TYPE "missao_tipo";

ALTER TABLE "possibilities" RENAME COLUMN "feedbackMissoesAtivacao" TO "feedbackEspecificacao";
ALTER TABLE "possibilities" ADD COLUMN "recorteEspecificado" JSONB;
