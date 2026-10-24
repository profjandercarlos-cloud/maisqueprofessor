// Cota de planos de execução por conta. TODO plano criado conta, mesmo que a
// pessoa nunca o execute: a criação gasta chamadas de IA (relatório + plano), então
// o limite protege o custo. Não existe "remover plano": quem cria, usa a vaga.
export const LIMITE_PLANOS = 5;

export type CotaDePlanos = {
  usados: number;
  limite: number;
  restantes: number;
  esgotada: boolean;
};

export function cotaDePlanos(usados: number): CotaDePlanos {
  return {
    usados,
    limite: LIMITE_PLANOS,
    restantes: Math.max(0, LIMITE_PLANOS - usados),
    esgotada: usados >= LIMITE_PLANOS,
  };
}

export const MENSAGEM_COTA_ESGOTADA = `Você já usou os ${LIMITE_PLANOS} planos de execução. Cada plano criado conta, mesmo que ainda não tenha sido executado.`;
