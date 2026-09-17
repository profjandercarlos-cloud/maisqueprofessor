-- Lock otimista por fase da fila de geração V4: reivindicado ANTES da
-- chamada à OpenAI (não só na gravação final), pra evitar chamada e custo
-- duplicados quando duas invocações da mesma fase disparam em paralelo.
ALTER TABLE "generation_rounds" ADD COLUMN "claimedAt" TIMESTAMP(3);
