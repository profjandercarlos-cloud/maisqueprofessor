-- Ajuste seletivo (2026-09): a pessoa pode escolher manter algumas das 5
-- possibilidades e trocar só as outras, em vez de refazer o conjunto
-- inteiro. Aditivo: nenhum campo existente é removido ou alterado.

ALTER TABLE "generation_rounds" ADD COLUMN "papeisSeletivosTrocar" JSONB;
