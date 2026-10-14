-- Novo grau de evidência (venda pública visível). Em migração própria porque
-- um valor de enum recém-criado não pode ser usado na mesma transação.
ALTER TYPE "forca_evidencia" ADD VALUE 'VENDA_PUBLICA_VISIVEL';
