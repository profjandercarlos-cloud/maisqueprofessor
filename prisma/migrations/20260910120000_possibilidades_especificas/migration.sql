-- Limpa possibilidades PENDENTE de todo o app (decisão explícita do
-- usuário) — o formato de card mudou e essas linhas não têm as colunas
-- novas. A possibilidade APROVADA que já virou um Plano fica intacta; por
-- isso as colunas novas precisam de DEFAULT pra permitir o backfill dela
-- (ela nunca mais é exibida, porque a página de adequação redireciona
-- direto pro plano quando a possibilidade já tem um).
DELETE FROM "possibilities" WHERE "status" = 'PENDENTE';

-- AlterTable
ALTER TABLE "possibilities" DROP COLUMN "jaPossuiVsAprender";
ALTER TABLE "possibilities"
  ADD COLUMN     "entregaPrincipal" TEXT NOT NULL DEFAULT '',
  ADD COLUMN     "comoSeriaRotina" TEXT NOT NULL DEFAULT '',
  ADD COLUMN     "primeiraVersaoPossivel" TEXT NOT NULL DEFAULT '',
  ADD COLUMN     "pontoDeAtencao" TEXT NOT NULL DEFAULT '',
  ADD COLUMN     "capacidadesAproveitaveis" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN     "aprendizagensPrioritarias" TEXT[] NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "generation_rounds" ADD COLUMN     "notaDiversidade" TEXT NOT NULL DEFAULT '';
