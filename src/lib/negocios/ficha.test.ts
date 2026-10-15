import { describe, expect, it } from "vitest";
import { FICHAS_EXEMPLO } from "./ficha-exemplos";
import { LINHA_MEI_NAO_VERIFICADO, comLinhaMei, fichaSchema, lerFicha, numerosDaFicha } from "./ficha";
import { LIMITE_LISTA, listaCheia, vagasNaLista } from "./lista";

const forma1 = {
  ordem: 1,
  investimentoInicialBrl: { min: 0, max: 150 },
  tempoAtePrimeiraVendaHipotese: "Hipótese, não prazo observado nem garantia: 2 a 4 semanas.",
};

describe("numerosDaFicha", () => {
  it("monta os números a partir do registro, sem IA", () => {
    const n = numerosDaFicha({
      tagPreparo: "comeca_ja",
      horasSemanaisMin: 8,
      horasSemanaisMax: 12,
      formasDeComecar: [{ ordem: 2 }, forma1],
    });
    expect(n.horas).toBe("8 a 12 h por semana");
    expect(n.investimento).toBe("R$ 0 a R$ 150");
    expect(n.primeiroCliente).toBe("2 a 4 semanas (hipótese)");
    expect(n.preparo).toBe("Pode começar já");
  });

  it("valores iguais viram um número só, e ausentes viram 'Não informado'", () => {
    const n = numerosDaFicha({
      tagPreparo: "outro",
      horasSemanaisMin: 10,
      horasSemanaisMax: 10,
      formasDeComecar: [{ ordem: 1, investimentoInicialBrl: { min: 300, max: 300 } }],
    });
    expect(n.horas).toBe("10 h por semana");
    expect(n.investimento).toBe("R$ 300");
    expect(n.primeiroCliente).toBe("Não informado");
    expect(n.preparo).toBe("Não informado");
  });
});

describe("ficha: validação", () => {
  it("as 5 fichas escritas à mão passam no schema", () => {
    for (const [codigo, ficha] of Object.entries(FICHAS_EXEMPLO)) {
      expect(fichaSchema.safeParse(ficha).success, codigo).toBe(true);
    }
  });

  it("lerFicha devolve null para dado inválido em vez de quebrar", () => {
    expect(lerFicha(null)).toBeNull();
    expect(lerFicha({ versao: 1, vende: "x" })).toBeNull();
    expect(lerFicha(FICHAS_EXEMPLO["ENS-APR-001"])).not.toBeNull();
  });

  it("nenhum exemplo usa jargão de analista", () => {
    const texto = JSON.stringify(FICHAS_EXEMPLO).toLowerCase();
    for (const termo of ["janela", "escopo", "delimitad", "mvp"]) {
      expect(texto, termo).not.toContain(termo);
    }
  });
});

describe("comLinhaMei", () => {
  const base = FICHAS_EXEMPLO["PRO-ALI-002"];
  const semMei = { ...base, cuidados: base.cuidados.filter((c) => !c.includes("MEI")) };

  it("acrescenta a linha quando o enquadramento não foi verificado", () => {
    expect(comLinhaMei(semMei, "nao_verificado").cuidados.at(-1)).toBe(LINHA_MEI_NAO_VERIFICADO);
  });
  it("não duplica se já existe, nem acrescenta quando foi verificado", () => {
    expect(comLinhaMei(base, "nao_verificado").cuidados).toEqual(base.cuidados);
    expect(comLinhaMei(semMei, "permitido_confirmado_em_fonte_oficial").cuidados).toEqual(semMei.cuidados);
  });
});

describe("lista", () => {
  it("o limite é 5 e as vagas nunca ficam negativas", () => {
    expect(LIMITE_LISTA).toBe(5);
    expect(vagasNaLista(0)).toBe(5);
    expect(vagasNaLista(3)).toBe(2);
    expect(vagasNaLista(9)).toBe(0);
    expect(listaCheia(4)).toBe(false);
    expect(listaCheia(5)).toBe(true);
  });
});
