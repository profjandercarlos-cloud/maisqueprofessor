import { describe, expect, it } from "vitest";
import repositorio from "@/data/repositorio-ideias.json";
import { CATEGORIAS_IDEIAS } from "./categorias";
import { aplicarTextos, conteudoSchema, faixaHoras, lerConteudo, reais, textosDoConteudo } from "./conteudo";
import { ORDENS_DO_TESTE, prepararImportacao } from "./importar";

describe("importação do repositório real", () => {
  const rel = prepararImportacao(repositorio);

  it("os 105 negócios passam na validação, sem nenhum erro", () => {
    expect(rel.erros).toEqual([]);
    expect(rel.total).toBe(105);
  });

  it("são 15 por categoria, nas 7 categorias conhecidas", () => {
    expect(Object.keys(rel.porCategoria).sort()).toEqual(CATEGORIAS_IDEIAS.map((c) => c.id).sort());
    for (const qtd of Object.values(rel.porCategoria)) expect(qtd).toBe(15);
  });

  it("todo conteúdo convertido é válido e as contas fecham", () => {
    for (const i of rel.ideias) {
      const c = conteudoSchema.parse(i.conteudo);
      const s = c.cincoAnos.simulacao;
      expect(s.receitas.reduce((a, r) => a + r.receitaMensal, 0), i.origemId).toBeCloseTo(s.faturamentoMensal, 2);
      expect(s.custos.reduce((a, x) => a + x.valor, 0), i.origemId).toBeCloseTo(s.totalCustos, 2);
      expect(s.faturamentoMensal - s.totalCustos, i.origemId).toBeCloseTo(s.resultado, 2);
    }
  });

  it("o teste importa 5 ideias de 5 categorias diferentes", () => {
    const teste = rel.ideias.filter((i) => ORDENS_DO_TESTE.includes(i.ordem));
    expect(teste).toHaveLength(5);
    expect(new Set(teste.map((i) => i.categoria)).size).toBe(5);
  });

  it("guarda o original com as fontes resolvidas", () => {
    const fontes = rel.ideias[0].dados.fontes as { id: string; titulo: string }[];
    expect(fontes.length).toBeGreaterThan(0);
    expect(fontes[0].titulo).toBeTruthy();
  });
});

describe("prepararImportacao: erros", () => {
  it("recusa arquivo fora do formato", () => {
    expect(prepararImportacao({}).erros).not.toEqual([]);
  });
  it("acusa fonte inexistente e slug repetido", () => {
    const base = (repositorio as { negocios: unknown[] }).negocios[0] as Record<string, unknown>;
    const dobro = { ...(repositorio as object), negocios: [base, { ...base, id: "neg_x", fontes_ids: ["F99"] }] };
    const erros = prepararImportacao(dobro).erros.join(" | ");
    expect(erros).toContain("slug repetido");
    expect(erros).toContain("fonte inexistente (F99)");
  });
});

describe("textos da IA nunca mexem em números", () => {
  const base = prepararImportacao(repositorio).ideias[0].conteudo;

  it("aplicarTextos troca só texto; horas, nome e simulação ficam", () => {
    const t = textosDoConteudo(base);
    const novo = aplicarTextos(base, { ...t, resumo: "Outro resumo", cincoAnos: { ...t.cincoAnos, marcos: ["a", "b", "c"], estrutura: "Nova estrutura" } });
    expect(novo.resumo).toBe("Outro resumo");
    expect(novo.cincoAnos.marcos.map((m) => m.descricao)).toEqual(["a", "b", "c"]);
    expect(novo.cincoAnos.marcos.map((m) => m.etapa)).toEqual(base.cincoAnos.marcos.map((m) => m.etapa));
    expect(novo.cincoAnos.simulacao).toEqual(base.cincoAnos.simulacao);
    expect(novo.cincoAnos.horasSemana).toEqual(base.cincoAnos.horasSemana);
    expect(novo.nome).toBe(base.nome);
  });

  it("marcos faltando na resposta da IA caem para o original", () => {
    const t = textosDoConteudo(base);
    const novo = aplicarTextos(base, { ...t, cincoAnos: { ...t.cincoAnos, marcos: ["só um"] } });
    expect(novo.cincoAnos.marcos).toHaveLength(base.cincoAnos.marcos.length);
    expect(novo.cincoAnos.marcos[1].descricao).toBe(base.cincoAnos.marcos[1].descricao);
  });

  it("lerConteudo devolve null para dado inválido", () => {
    expect(lerConteudo(null)).toBeNull();
    expect(lerConteudo({ versao: 1 })).toBeNull();
    expect(lerConteudo(base)).not.toBeNull();
  });
});

describe("formatação", () => {
  it("reais e faixa de horas", () => {
    expect(reais(6500).replace(/\s/g, " ")).toBe("R$ 6.500,00");
    expect(faixaHoras({ minimo: 22, maximo: 28 })).toBe("22 a 28 h por semana");
    expect(faixaHoras({ minimo: 10, maximo: 10 })).toBe("10 h por semana");
  });
});
