import { describe, expect, it } from "vitest";
import { planoDeAcoesSchema } from "@/lib/ai-engine/generate-plano-acoes-openai";
import { ADEQUACAO_STEPS, getResumeSlug } from "@/lib/adequacao/steps";
import { medalhasDoPlano } from "./active-plan-badge";
import { lerOrientacoes, resumoDasAcoes, statusDaAcao, type StatusAcao } from "./acoes";

const itens = (...feitos: boolean[]) => feitos.map((feito) => ({ feito }));

describe("statusDaAcao (sai do checklist, nunca é digitado)", () => {
  it("nenhum item marcado = a fazer; sem itens também", () => {
    expect(statusDaAcao(itens(false, false, false))).toBe("A_FAZER");
    expect(statusDaAcao([])).toBe("A_FAZER");
  });
  it("alguns marcados = em andamento", () => {
    expect(statusDaAcao(itens(true, false, false))).toBe("EM_ANDAMENTO");
    expect(statusDaAcao(itens(true, true, false))).toBe("EM_ANDAMENTO");
  });
  it("todos marcados = concluída; desmarcar um volta para em andamento", () => {
    expect(statusDaAcao(itens(true, true, true))).toBe("CONCLUIDA");
    expect(statusDaAcao(itens(true, true, false))).toBe("EM_ANDAMENTO");
  });
});

describe("resumoDasAcoes", () => {
  const acoes = (...s: StatusAcao[]) => s.map((status, i) => ({ sequencia: i + 1, status }));

  it("conta '3 de 8' e o percentual só pelas concluídas", () => {
    const r = resumoDasAcoes(acoes("CONCLUIDA", "CONCLUIDA", "CONCLUIDA", "EM_ANDAMENTO", "A_FAZER", "A_FAZER", "A_FAZER", "A_FAZER"));
    expect(r).toMatchObject({ total: 8, concluidas: 3, emAndamento: 1, aFazer: 4, percentual: 38 });
  });
  it("a próxima ação é a em andamento; se não houver, a primeira a fazer", () => {
    expect(resumoDasAcoes(acoes("CONCLUIDA", "EM_ANDAMENTO", "A_FAZER")).proxima).toBe(2);
    expect(resumoDasAcoes(acoes("CONCLUIDA", "CONCLUIDA", "A_FAZER", "A_FAZER")).proxima).toBe(3);
  });
  it("plano todo concluído não tem próxima; plano vazio não quebra", () => {
    expect(resumoDasAcoes(acoes("CONCLUIDA", "CONCLUIDA")).proxima).toBeNull();
    expect(resumoDasAcoes([])).toMatchObject({ total: 0, percentual: 0, proxima: null });
  });
  it("ignora a ordem em que as ações chegam", () => {
    const r = resumoDasAcoes([
      { sequencia: 3, status: "A_FAZER" },
      { sequencia: 1, status: "CONCLUIDA" },
      { sequencia: 2, status: "A_FAZER" },
    ]);
    expect(r.proxima).toBe(2);
  });
});

describe("medalhas do cabeçalho", () => {
  it("uma medalha a cada quinto do plano, no máximo 5", () => {
    expect(medalhasDoPlano(0, 8)).toBe(0);
    expect(medalhasDoPlano(1, 8)).toBe(0);
    expect(medalhasDoPlano(2, 8)).toBe(1);
    expect(medalhasDoPlano(4, 8)).toBe(2);
    expect(medalhasDoPlano(8, 8)).toBe(5);
    expect(medalhasDoPlano(5, 0)).toBe(0);
  });
});

describe("orientações da ação", () => {
  it("lê o formato salvo e devolve null para dado inválido", () => {
    expect(lerOrientacoes({ comoFazer: ["a"], pontosDeAtencao: ["b"], errosComuns: ["c"] })).not.toBeNull();
    expect(lerOrientacoes(null)).toBeNull();
    expect(lerOrientacoes({ comoFazer: "texto" })).toBeNull();
  });
});

describe("plano gerado pela IA", () => {
  const acao = (i: number) => ({
    nome: `Ação ${i}`,
    objetivo: "Objetivo",
    definicao_de_pronto: "Pronto quando existir",
    checklist: ["a", "b", "c"],
    como_fazer: ["x", "y"],
    pontos_de_atencao: ["p"],
    erros_comuns: ["e"],
  });
  const base = (n: number) => ({
    encaixe: { classificacao: "cabe_agora", explicacao: "ok" },
    resumo: { por_que_esse_plano: "a", resultado_minimo_viavel: "b", entrega_final: "c" },
    acoes: Array.from({ length: n }, (_, i) => acao(i + 1)),
  });

  it("aceita de 5 a 10 ações", () => {
    expect(planoDeAcoesSchema.safeParse(base(5)).success).toBe(true);
    expect(planoDeAcoesSchema.safeParse(base(10)).success).toBe(true);
  });
  it("recusa menos de 5, mais de 10, checklist curto e classificação desconhecida", () => {
    expect(planoDeAcoesSchema.safeParse(base(4)).success).toBe(false);
    expect(planoDeAcoesSchema.safeParse(base(11)).success).toBe(false);
    const curto = base(5);
    curto.acoes[0].checklist = ["só um"];
    expect(planoDeAcoesSchema.safeParse(curto).success).toBe(false);
    const invalida = { ...base(5), encaixe: { classificacao: "talvez", explicacao: "x" } };
    expect(planoDeAcoesSchema.safeParse(invalida).success).toBe(false);
  });
});

describe("questionário de execução curto", () => {
  it("tem só 3 perguntas, sem ritmo, distribuição, check-in nem ações aceitas", () => {
    expect(ADEQUACAO_STEPS.map((s) => s.slug)).toEqual(["estagio-inicial", "horas-semanais", "orcamento"]);
  });
  it("continua de onde parou e conclui quando as 3 estão respondidas", () => {
    expect(getResumeSlug({})).toBe("estagio-inicial");
    expect(getResumeSlug({ estagioInicial: "NUNCA_FIZ" })).toBe("horas-semanais");
    expect(getResumeSlug({ estagioInicial: "NUNCA_FIZ", horasSemanaisDisponiveis: 4 })).toBe("orcamento");
    expect(
      getResumeSlug({ estagioInicial: "NUNCA_FIZ", horasSemanaisDisponiveis: 4, orcamentoTotal12Semanas: "ATE_300" }),
    ).toBe("concluido");
  });
});
