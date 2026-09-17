-- Limpa possibilidades PENDENTE (decisão explícita do usuário, mesmo
-- padrão já usado nas duas rodadas anteriores) — o formato mudou de novo e
-- essas linhas não têm as colunas novas. A única possibilidade que resta é
-- a APROVADA de jandercarlos@uol.com.br, que já tem um Plano ATIVO — por
-- isso as colunas novas ganham DEFAULT (ela nunca é mais renderizada crua,
-- a página de adequação redireciona direto pro plano quando já existe um).
DELETE FROM "possibilities" WHERE "status" = 'PENDENTE';

-- CreateEnum
CREATE TYPE "horizonte_economico" AS ENUM ('CURTO_PRAZO', 'MEDIO_PRAZO', 'LONGO_PRAZO');
CREATE TYPE "nivel_lastro" AS ENUM ('FORTE', 'MODERADO', 'EXPLORATORIO');

-- AlterEnum (não remove COMO_QUER_TRABALHAR_E_CRESCER — recriar o tipo pra
-- remover um valor não vale o risco; ele só fica sem uso a partir de agora)
ALTER TYPE "possibility_role" ADD VALUE 'MAIOR_CONVERGENCIA_COMERCIAL';

-- AlterTable
ALTER TABLE "generation_rounds"
  ADD COLUMN     "metaFinanceiraUsada" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN     "avisoEconomico" TEXT NOT NULL DEFAULT '',
  ADD COLUMN     "dadosAusentesRelevantes" TEXT[] NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "possibilities" DROP COLUMN "naPratica";
ALTER TABLE "possibilities" DROP COLUMN "entregaPrincipal";
ALTER TABLE "possibilities" DROP COLUMN "quemPagaria";
ALTER TABLE "possibilities" DROP COLUMN "porQueApareceu";
ALTER TABLE "possibilities" DROP COLUMN "capacidadesAproveitaveis";
ALTER TABLE "possibilities" DROP COLUMN "aprendizagensPrioritarias";
ALTER TABLE "possibilities" DROP COLUMN "primeiraVersaoPossivel";
ALTER TABLE "possibilities" DROP COLUMN "familiaValor";
ALTER TABLE "possibilities"
  ADD COLUMN     "horizonteEconomico" "horizonte_economico" NOT NULL DEFAULT 'MEDIO_PRAZO',
  ADD COLUMN     "nivelLastro" "nivel_lastro" NOT NULL DEFAULT 'MODERADO',
  ADD COLUMN     "destaque" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN     "comoFunciona" TEXT NOT NULL DEFAULT '',
  ADD COLUMN     "quemPagariaEComo" TEXT NOT NULL DEFAULT '',
  ADD COLUMN     "porQueCombinaComVoce" TEXT NOT NULL DEFAULT '',
  ADD COLUMN     "primeiraValidacao" TEXT NOT NULL DEFAULT '',
  ADD COLUMN     "caminhoEconomico" TEXT NOT NULL DEFAULT '',
  ADD COLUMN     "analiseInterna" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN     "analiseConvergenciaComercial" JSONB;
