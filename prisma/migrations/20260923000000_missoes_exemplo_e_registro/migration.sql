-- Missoes de ativacao ganham pergunta de registro especifica (substitui o
-- generico "o que aconteceu?", sempre cobrindo a principal dificuldade) e um
-- exemplo concreto de execucao, gerados pela IA junto com cada missao.
-- Limpa as missoes existentes (dados de teste) antes de tornar as colunas
-- obrigatorias, ja que o conteudo antigo nao tem esses campos.

DELETE FROM "missoes_ativacao";

ALTER TABLE "missoes_ativacao" ADD COLUMN "perguntaRegistro" TEXT NOT NULL;
ALTER TABLE "missoes_ativacao" ADD COLUMN "exemploCenario" TEXT NOT NULL;
ALTER TABLE "missoes_ativacao" ADD COLUMN "exemploResultado" TEXT NOT NULL;
