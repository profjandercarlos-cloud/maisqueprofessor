import { describe, expect, it } from "vitest";
import {
  LIMITE_DESBLOQUEIOS_GRATUITOS,
  desbloqueiosRestantes,
  nivelDeVisao,
  projetarNegocio,
  type NegocioFonte,
} from "./visibilidade";

const forma = (ordem: number) => ({
  ordem,
  tipo: "prestacao_de_servico",
  titulo: `Forma ${ordem}`,
  oQueFazerPrimeiro: "x",
  comoChegarAoPrimeiroCliente: "x",
  investimentoInicialBrl: { min: 0, max: 100 },
  tempoAtePrimeiraVendaHipotese: "x",
  oQueEstaEtapaValida: "x",
  proximoPassoParaVirarNegocio: "x",
});

// Registro "do banco" com campos extras que NUNCA podem aparecer (internos).
const registro = {
  codigo: "ENS-APR-001",
  categoria: "ENSINAR_E_DESENVOLVER",
  nome: "Reforço de matemática",
  posicionamento: "pos",
  oQueOClienteRecebe: "recebe",
  compradorPersona: "persona",
  gatilhoDeCompra: "gatilho",
  clientePagaParaResolver: "paga",
  sinalObservado: "SEGREDO-SINAL",
  nivelEvidencia: "OFERTA_PUBLICADA",
  fontes: [{ url: "https://a.com", natureza: "n", afirma: "a", paginaAbertaNestaRodada: true }],
  modeloDeReceita: "modelo",
  faixaDePreco: { valorMinBrl: 120, valorMaxBrl: 120, unidade: "por aula", tipo: "t", fonteOuBase: "f", ePrecoDeIniciante: false },
  comoCresce: "SEGREDO-CRESCE",
  riscoEstrutural: "SEGREDO-RISCO",
  exigenciasLegais: "exigencia",
  tagOnde: "online",
  tagQuemExecuta: "so_eu",
  tagPreparo: "comeca_ja",
  tagInvestimentoInicial: "baixo",
  tagEscala: "renda_extra",
  tagRetorno: "medio_prazo",
  tagReceita: "recorrente",
  tagCliente: "pessoa_fisica",
  habilidadesDoProfessor: ["comunicacao_didatica"],
  relacaoComDocencia: "ENSINO_FORA_DA_ESCOLA",
  enquadramentoMei: "nao_verificado",
  horasSemanaisMin: 8,
  horasSemanaisMax: 12,
  formasDeComecar: [forma(1), forma(2), forma(3)],
  // internos
  principalLacuna: "INTERNO-LACUNA",
  testePilotoNecessario: "INTERNO-TESTE",
  conclusao: "INTERNO-CONCLUSAO",
  notaRevisao: "INTERNO-NOTA",
  origem: "INTERNO-ORIGEM",
  status: "APROVADO",
  grupoSemelhante: "INTERNO-GRUPO",
  fontesCompartilhadas: true,
} satisfies NegocioFonte & Record<string, unknown>;

describe("nivelDeVisao", () => {
  it("básico quando nada libera", () => {
    expect(nivelDeVisao({ pago: false, liberadoGratuito: false, desbloqueado: false })).toBe("basico");
  });
  it("completo se pago, liberado pelo admin ou desbloqueado", () => {
    expect(nivelDeVisao({ pago: true, liberadoGratuito: false, desbloqueado: false })).toBe("completo");
    expect(nivelDeVisao({ pago: false, liberadoGratuito: true, desbloqueado: false })).toBe("completo");
    expect(nivelDeVisao({ pago: false, liberadoGratuito: false, desbloqueado: true })).toBe("completo");
  });
});

describe("desbloqueiosRestantes", () => {
  it("conta a partir do limite e nunca fica negativo", () => {
    expect(desbloqueiosRestantes(0)).toBe(LIMITE_DESBLOQUEIOS_GRATUITOS);
    expect(desbloqueiosRestantes(1)).toBe(LIMITE_DESBLOQUEIOS_GRATUITOS - 1);
    expect(desbloqueiosRestantes(99)).toBe(0);
  });
});

describe("projetarNegocio", () => {
  it("básico: não traz nenhum dado de nível completo nem interno", () => {
    const json = JSON.stringify(projetarNegocio(registro, "basico"));
    for (const segredo of ["SEGREDO-", "INTERNO-", "https://a.com", "Forma 2", "Forma 3"]) {
      expect(json).not.toContain(segredo);
    }
  });

  it("básico: traz a forma de começar nº 1 e as exigências legais", () => {
    const p = projetarNegocio(registro, "basico");
    expect(p.completo).toBeNull();
    expect(p.basico.formaDeComecar?.titulo).toBe("Forma 1");
    expect(p.basico.exigenciasLegais).toBe("exigencia");
    expect(p.basico.faixaDePreco?.valorMinBrl).toBe(120);
  });

  it("completo: acrescenta o resto, mas continua sem nenhum dado interno", () => {
    const p = projetarNegocio(registro, "completo");
    expect(p.completo?.comoCresce).toBe("SEGREDO-CRESCE");
    expect(p.completo?.fontes[0]).toEqual({ url: "https://a.com", natureza: "n", afirma: "a" });
    expect(p.completo?.outrasFormasDeComecar.map((f) => f.ordem)).toEqual([2, 3]);
    expect(JSON.stringify(p)).not.toContain("INTERNO-");
  });

  it("faixa de preço sem valor algum vira null", () => {
    const p = projetarNegocio(
      { ...registro, faixaDePreco: { valorMinBrl: null, valorMaxBrl: null, unidade: "x", tipo: "t", fonteOuBase: "f", ePrecoDeIniciante: false } },
      "basico",
    );
    expect(p.basico.faixaDePreco).toBeNull();
  });
});
