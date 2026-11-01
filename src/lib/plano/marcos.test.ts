import { describe, expect, it } from "vitest";
import { planoDeAcoesSchema } from "@/lib/ai-engine/generate-plano-acoes-openai";
import { marcosValidos, medalhasConquistadas, normalizarMarcos, TOTAL_MARCOS } from "./marcos";
import type { StatusAcao } from "./acoes";

const marcos = (...acoes: number[]) => acoes.map((acao, i) => ({ acao, nome: `Marco ${i + 1}` }));

describe("marcos do plano (as 5 medalhas)", () => {
  it("aceita 5 marcos em ações diferentes, crescentes, com o último na última ação", () => {
    expect(marcosValidos(marcos(1, 3, 5, 7, 8), 8)).toBe(true);
    expect(marcosValidos(marcos(1, 2, 3, 4, 5), 5)).toBe(true); // plano mínimo: cada ação fecha um marco
    expect(marcosValidos(marcos(2, 4, 6, 8, 10), 10)).toBe(true);
  });

  it("recusa quantidade errada, ação inexistente, ordem não crescente, repetição e último fora da avaliação", () => {
    expect(marcosValidos(marcos(1, 3, 5, 8), 8)).toBe(false); // só 4
    expect(marcosValidos(marcos(1, 3, 5, 7, 8, 9), 9)).toBe(false); // 6
    expect(marcosValidos(marcos(0, 3, 5, 7, 8), 8)).toBe(false); // ação 0
    expect(marcosValidos(marcos(1, 3, 5, 7, 9), 8)).toBe(false); // ação 9 não existe
    expect(marcosValidos(marcos(1, 5, 3, 7, 8), 8)).toBe(false); // fora de ordem
    expect(marcosValidos(marcos(1, 3, 3, 7, 8), 8)).toBe(false); // repetida
    expect(marcosValidos(marcos(1, 3, 5, 6, 7), 8)).toBe(false); // o último não é a avaliação
    expect(marcosValidos([...marcos(1, 3, 5, 7), { acao: 8, nome: "  " }], 8)).toBe(false); // nome vazio
  });

  it("mantém os marcos da IA quando válidos (com o nome aparado)", () => {
    const r = normalizarMarcos([...marcos(1, 3, 5, 7), { acao: 8, nome: "  Avaliação feita " }], 8);
    expect(r.map((m) => m.acao)).toEqual([1, 3, 5, 7, 8]);
    expect(r[4].nome).toBe("Avaliação feita");
  });

  it("quando a IA erra, redistribui em 5 ações distintas, crescentes, terminando na última, para qualquer tamanho de plano", () => {
    for (let total = 5; total <= 10; total++) {
      const r = normalizarMarcos([], total);
      expect(r).toHaveLength(TOTAL_MARCOS);
      expect(marcosValidos(r, total), `plano de ${total} ações`).toBe(true);
    }
  });
});

describe("medalhas conquistadas", () => {
  const acoes = (...s: [StatusAcao, string | null][]) =>
    s.map(([status, marco], i) => ({ sequencia: i + 1, status, marco }));

  it("com marcos, cada marco cuja ação foi concluída vale uma medalha", () => {
    const a = acoes(
      ["CONCLUIDA", null],
      ["CONCLUIDA", "Oferta definida"],
      ["EM_ANDAMENTO", null],
      ["A_FAZER", "Primeiro contato"],
    );
    expect(medalhasConquistadas(a)).toBe(1);
  });

  it("concluir uma ação sem marco não dá medalha", () => {
    expect(medalhasConquistadas(acoes(["CONCLUIDA", null], ["A_FAZER", "Piloto entregue"]))).toBe(0);
  });

  it("todos os marcos concluídos = 5 medalhas", () => {
    const a = acoes(
      ["CONCLUIDA", "A"],
      ["CONCLUIDA", null],
      ["CONCLUIDA", "B"],
      ["CONCLUIDA", "C"],
      ["CONCLUIDA", "D"],
      ["CONCLUIDA", "E"],
    );
    expect(medalhasConquistadas(a)).toBe(5);
  });

  it("plano sem marcos (anterior a esta regra) cai em uma medalha a cada quinto concluído", () => {
    const a = acoes(["CONCLUIDA", null], ["CONCLUIDA", null], ["A_FAZER", null], ["A_FAZER", null], ["A_FAZER", null]);
    expect(medalhasConquistadas(a)).toBe(2);
  });
});

describe("plano gerado pela IA com marcos", () => {
  const acao = (i: number) => ({
    nome: `Ação ${i}`,
    objetivo: "Objetivo",
    definicao_de_pronto: "Pronto",
    checklist: ["a", "b", "c"],
    como_fazer: ["x", "y"],
    pontos_de_atencao: ["p"],
    erros_comuns: ["e"],
  });
  const base = {
    encaixe: { classificacao: "cabe_agora", explicacao: "ok" },
    resumo: { por_que_esse_plano: "a", resultado_minimo_viavel: "b", entrega_final: "c" },
    acoes: Array.from({ length: 6 }, (_, i) => acao(i + 1)),
  };

  it("lê os marcos devolvidos e, se faltarem, assume lista vazia (o plano não falha)", () => {
    const com = planoDeAcoesSchema.parse({ ...base, marcos: marcos(1, 2, 3, 4, 6) });
    expect(com.marcos).toHaveLength(5);
    expect(planoDeAcoesSchema.parse(base).marcos).toEqual([]);
  });
});
