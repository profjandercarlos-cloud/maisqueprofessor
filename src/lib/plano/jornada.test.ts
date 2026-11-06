import { describe, expect, it } from "vitest";
import { estadosDaJornada, passoAtualDaJornada } from "./jornada";
import { situacaoDoNegocio } from "./situacao-do-negocio";

const vazio = { diagnosticoConcluido: false, negociosGerados: 0, favoritos: 0, planos: 0 };

describe("jornada do Painel", () => {
  it("quem acabou de chegar começa pelo diagnóstico", () => {
    expect(passoAtualDaJornada(vazio)).toBe("diagnostico");
    expect(estadosDaJornada(vazio)).toEqual({
      diagnostico: "atual",
      negocios: "pendente",
      planos: "pendente",
      execucao: "pendente",
    });
  });
  it("diagnóstico concluído, mas negócios ainda não gerados: o passo é Negócios", () => {
    expect(passoAtualDaJornada({ ...vazio, diagnosticoConcluido: true })).toBe("negocios");
  });
  it("negócios gerados e sem plano: o próximo é criar o plano", () => {
    const s = { ...vazio, diagnosticoConcluido: true, negociosGerados: 5 };
    expect(estadosDaJornada(s)).toEqual({
      diagnostico: "feito",
      negocios: "feito",
      planos: "atual",
      execucao: "pendente",
    });
  });
  it("favoritos sem diagnóstico também levam ao plano (duas portas, um funil)", () => {
    const s = { ...vazio, favoritos: 2 };
    expect(estadosDaJornada(s)).toEqual({
      diagnostico: "pendente",
      negocios: "feito",
      planos: "atual",
      execucao: "pendente",
    });
  });
  it("com plano criado e ainda não concluído, a pessoa está na Execução", () => {
    const s = { diagnosticoConcluido: true, negociosGerados: 5, favoritos: 0, planos: 1, planosConcluidos: 0 };
    expect(passoAtualDaJornada(s)).toBe("execucao");
    expect(estadosDaJornada(s)).toEqual({
      diagnostico: "feito",
      negocios: "feito",
      planos: "feito",
      execucao: "atual",
    });
  });
  it("com um plano concluído e outro em andamento, continua na Execução", () => {
    const s = { ...vazio, favoritos: 1, planos: 2, planosConcluidos: 1 };
    expect(passoAtualDaJornada(s)).toBe("execucao");
  });
  it("todos os planos concluídos: a jornada está completa e nenhum passo fica 'atual'", () => {
    const s = { diagnosticoConcluido: true, negociosGerados: 5, favoritos: 0, planos: 1, planosConcluidos: 1 };
    expect(passoAtualDaJornada(s)).toBeNull();
    expect(estadosDaJornada(s)).toEqual({
      diagnostico: "feito",
      negocios: "feito",
      planos: "feito",
      execucao: "feito",
    });
  });
});

describe("situação do negócio", () => {
  const acao = (status: "A_FAZER" | "EM_ANDAMENTO" | "CONCLUIDA") => ({ status });
  it("percorre disponível → escolhido → plano criado → em execução → concluído", () => {
    expect(situacaoDoNegocio({ status: "PENDENTE", plan: null })).toBe("disponivel");
    expect(situacaoDoNegocio({ status: "APROVADA", plan: null })).toBe("escolhido");
    expect(situacaoDoNegocio({ status: "APROVADA", plan: { acoes: [acao("A_FAZER"), acao("A_FAZER")] } })).toBe("plano_criado");
    expect(situacaoDoNegocio({ status: "APROVADA", plan: { acoes: [acao("EM_ANDAMENTO"), acao("A_FAZER")] } })).toBe("em_execucao");
    expect(situacaoDoNegocio({ status: "APROVADA", plan: { acoes: [acao("CONCLUIDA"), acao("CONCLUIDA")] } })).toBe("concluido");
  });
  it("rejeitado vira 'não seguido' e plano de formato antigo (sem ações) conta como plano criado", () => {
    expect(situacaoDoNegocio({ status: "REJEITADA", plan: null })).toBe("nao_seguido");
    expect(situacaoDoNegocio({ status: "APROVADA", plan: { acoes: [] } })).toBe("plano_criado");
  });
});
