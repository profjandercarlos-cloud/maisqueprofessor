-- Motor "macro nicho" — identifica o fio condutor da pessoa antes de gerar
-- as 5 possibilidades, e passa a embutir conexão com mercado + trajetória
-- financeira (1/3/5 anos) direto na geração, em vez de uma fase separada
-- depois. Aditivo: nenhum campo existente é removido ou alterado.

ALTER TABLE "generation_rounds" ADD COLUMN "macroNicho" JSONB;
ALTER TABLE "generation_rounds" ADD COLUMN "premissasFinanceirasGerais" TEXT;

ALTER TABLE "possibilities" ADD COLUMN "dominioAplicacao" TEXT;
ALTER TABLE "possibilities" ADD COLUMN "mecanismoComercialClasse" TEXT;
ALTER TABLE "possibilities" ADD COLUMN "profundidade" TEXT;
ALTER TABLE "possibilities" ADD COLUMN "conexaoMundoReal" JSONB;
ALTER TABLE "possibilities" ADD COLUMN "trajetoriaFinanceira" JSONB;
ALTER TABLE "possibilities" ADD COLUMN "tempoDedicacao" JSONB;
