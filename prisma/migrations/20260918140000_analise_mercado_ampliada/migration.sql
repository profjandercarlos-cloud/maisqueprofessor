-- Camada de apresentação aditiva (nome de mercado real, compradores
-- nomeados, cenário de referência, ponto de atenção reformulado) — 100%
-- reversível: nula até a fase própria rodar, nunca bloqueia o resto.

ALTER TABLE "possibilities" ADD COLUMN "analiseMercadoAmpliada" JSONB;
