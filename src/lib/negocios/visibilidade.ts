// Três níveis de visibilidade de um Pequeno Negócio:
//   - interno: só o admin (auditoria, nota de revisão, origem, status...)
//   - básico (gratuito): o suficiente para entender e começar pela forma nº 1
//   - completo (pago, ou desbloqueado/liberado): o resto do negócio
//
// projetarNegocio monta o objeto campo a campo — de propósito não espalha o
// registro do banco, pra que um campo novo adicionado ao model NUNCA vire
// visível por acidente. Dado de nível completo nem chega à página de quem só
// pode ver o básico.

// Quantos negócios uma conta gratuita pode ver por completo. Mudar aqui.
export const LIMITE_DESBLOQUEIOS_GRATUITOS = 3;

export type NivelVisao = "basico" | "completo";

export function nivelDeVisao(args: {
  pago: boolean;
  liberadoGratuito: boolean;
  desbloqueado: boolean;
}): NivelVisao {
  return args.pago || args.liberadoGratuito || args.desbloqueado ? "completo" : "basico";
}

export function desbloqueiosRestantes(usados: number): number {
  return Math.max(0, LIMITE_DESBLOQUEIOS_GRATUITOS - usados);
}

export type FormaDeComecar = {
  ordem: number;
  tipo: string;
  titulo: string;
  oQueFazerPrimeiro: string;
  comoChegarAoPrimeiroCliente: string;
  investimentoInicialBrl: { min: number | null; max: number | null } | null;
  tempoAtePrimeiraVendaHipotese: string;
  oQueEstaEtapaValida: string;
  proximoPassoParaVirarNegocio: string;
};

export type FontePublica = { url: string; natureza: string; afirma: string };

export type FaixaDePreco = {
  valorMinBrl: number | null;
  valorMaxBrl: number | null;
  unidade: string;
  tipo: string;
  fonteOuBase: string;
  ePrecoDeIniciante: boolean;
};

// Só os campos que a projeção lê — o registro do Prisma satisfaz este tipo.
export type NegocioFonte = {
  codigo: string;
  categoria: string;
  nome: string;
  posicionamento: string;
  oQueOClienteRecebe: string;
  compradorPersona: string;
  gatilhoDeCompra: string;
  clientePagaParaResolver: string;
  sinalObservado: string;
  nivelEvidencia: string;
  fontes: unknown;
  modeloDeReceita: string;
  faixaDePreco: unknown;
  comoCresce: string;
  riscoEstrutural: string;
  exigenciasLegais: string | null;
  tagOnde: string;
  tagQuemExecuta: string;
  tagPreparo: string;
  tagInvestimentoInicial: string;
  tagEscala: string;
  tagRetorno: string;
  tagReceita: string;
  tagCliente: string;
  habilidadesDoProfessor: string[];
  relacaoComDocencia: string;
  enquadramentoMei: string;
  horasSemanaisMin: number | null;
  horasSemanaisMax: number | null;
  formasDeComecar: unknown;
};

export type NegocioBasico = {
  codigo: string;
  categoria: string;
  nome: string;
  posicionamento: string;
  oQueOClienteRecebe: string;
  compradorPersona: string;
  gatilhoDeCompra: string;
  clientePagaParaResolver: string;
  modeloDeReceita: string;
  faixaDePreco: FaixaDePreco | null;
  exigenciasLegais: string | null;
  tagOnde: string;
  tagQuemExecuta: string;
  tagPreparo: string;
  tagInvestimentoInicial: string;
  tagEscala: string;
  tagRetorno: string;
  tagReceita: string;
  tagCliente: string;
  habilidadesDoProfessor: string[];
  relacaoComDocencia: string;
  enquadramentoMei: string;
  horasSemanaisMin: number | null;
  horasSemanaisMax: number | null;
  formaDeComecar: FormaDeComecar | null;
};

export type NegocioCompleto = {
  comoCresce: string;
  riscoEstrutural: string;
  sinalObservado: string;
  nivelEvidencia: string;
  fontes: FontePublica[];
  outrasFormasDeComecar: FormaDeComecar[];
};

export type NegocioProjetado = { nivel: NivelVisao; basico: NegocioBasico; completo: NegocioCompleto | null };

export function projetarNegocio(n: NegocioFonte, nivel: NivelVisao): NegocioProjetado {
  const formas = (Array.isArray(n.formasDeComecar) ? n.formasDeComecar : []) as FormaDeComecar[];
  const faixa = n.faixaDePreco as FaixaDePreco | null;

  const basico: NegocioBasico = {
    codigo: n.codigo,
    categoria: n.categoria,
    nome: n.nome,
    posicionamento: n.posicionamento,
    oQueOClienteRecebe: n.oQueOClienteRecebe,
    compradorPersona: n.compradorPersona,
    gatilhoDeCompra: n.gatilhoDeCompra,
    clientePagaParaResolver: n.clientePagaParaResolver,
    modeloDeReceita: n.modeloDeReceita,
    faixaDePreco: faixa && (faixa.valorMinBrl != null || faixa.valorMaxBrl != null) ? faixa : null,
    exigenciasLegais: n.exigenciasLegais,
    tagOnde: n.tagOnde,
    tagQuemExecuta: n.tagQuemExecuta,
    tagPreparo: n.tagPreparo,
    tagInvestimentoInicial: n.tagInvestimentoInicial,
    tagEscala: n.tagEscala,
    tagRetorno: n.tagRetorno,
    tagReceita: n.tagReceita,
    tagCliente: n.tagCliente,
    habilidadesDoProfessor: n.habilidadesDoProfessor,
    relacaoComDocencia: n.relacaoComDocencia,
    enquadramentoMei: n.enquadramentoMei,
    horasSemanaisMin: n.horasSemanaisMin,
    horasSemanaisMax: n.horasSemanaisMax,
    formaDeComecar: formas.find((f) => f.ordem === 1) ?? null,
  };

  if (nivel !== "completo") return { nivel, basico, completo: null };

  const fontes = (Array.isArray(n.fontes) ? n.fontes : []) as FontePublica[];
  return {
    nivel,
    basico,
    completo: {
      comoCresce: n.comoCresce,
      riscoEstrutural: n.riscoEstrutural,
      sinalObservado: n.sinalObservado,
      nivelEvidencia: n.nivelEvidencia,
      fontes: fontes.map((f) => ({ url: f.url, natureza: f.natureza, afirma: f.afirma })),
      outrasFormasDeComecar: formas.filter((f) => f.ordem !== 1),
    },
  };
}
