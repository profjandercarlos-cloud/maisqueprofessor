// "Minha lista": o professor escolhe, entre os pequenos negócios, até
// LIMITE_LISTA que quer transformar em plano de execução. Exige conta
// (gratuita ou paga) — o botão só aparece para quem está logado.
export const LIMITE_LISTA = 5;

// Os planos de execução a partir da lista AINDA NÃO existem (hoje o plano nasce
// do questionário). Enquanto isto for false, nenhuma tela promete "5 planos dos
// seus 5 negócios". Ligar só quando o gerador de plano por negócio estiver no ar.
export const PLANOS_DA_LISTA_DISPONIVEIS = false;

export function vagasNaLista(qtd: number): number {
  return Math.max(0, LIMITE_LISTA - qtd);
}

export function listaCheia(qtd: number): boolean {
  return qtd >= LIMITE_LISTA;
}
