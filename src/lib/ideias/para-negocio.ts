import type { ConteudoIdeia } from "./conteudo";

// Uma ideia favoritada vira um "negócio" (Possibility) para entrar no mesmo caminho
// do plano: questionário curto → Mapa de Execução → plano por ações. Os campos de
// texto vêm do conteúdo da ideia; os de análise do gerador (impressão digital,
// horizontes, base no histórico) ficam neutros, porque nenhum diagnóstico existe.
export function negocioDeIdeia(conteudo: ConteudoIdeia) {
  const { empresaFaz, primeiroServico } = conteudo;
  return {
    papel: "IDEIA_DO_CATALOGO" as const,
    titulo: conteudo.nome,
    subtitulo: conteudo.resumo,
    tempoPrimeiraValidacao: "MEDIO_PRAZO" as const,
    horizonteRelevanciaFinanceira: "A_VALIDAR" as const,
    baseNoHistorico: "EXPLORATORIO" as const,
    comoFunciona: `${empresaFaz.descricao} ${empresaFaz.exemplo}`,
    comoGerarReceita: empresaFaz.focoLucratividade,
    porQueCombinaComVoce: conteudo.porqueAtencao.join(" "),
    primeiraValidacao: `${primeiroServico.oferta} ${primeiroServico.plano}`,
    pontoDeAtencao:
      primeiroServico.observacaoEscopo ?? "Defina com clareza o escopo do primeiro serviço antes de oferecê-lo.",
    impressaoDigital: {},
  };
}
