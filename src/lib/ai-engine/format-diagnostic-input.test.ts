import { describe, expect, it } from "vitest";
import { formatDiagnosticInput, listarRespostas } from "./format-diagnostic-input";

const diagnostico = { intention: "SAIR", rotaProfissional: "CRIACAO_VALOR", answers: {} } as const;

describe("respostas do diagnóstico na tela", () => {
  const blocos = listarRespostas(diagnostico);

  it("abre com 'Sua direção' e usa títulos legíveis, sem os nomes técnicos dos blocos", () => {
    expect(blocos[0].titulo).toBe("Sua direção");
    expect(blocos.map((b) => b.titulo)).toEqual([
      "Sua direção",
      "Suas experiências reais",
      "O que te interessa e mobiliza",
      "Seu futuro profissional",
      "Sobre o caminho que você escolheu",
      "Sua realidade financeira",
    ]);
  });

  it("a direção reúne intenção, rota e as perguntas do bloco 1, sem repetir a rota", () => {
    const perguntas = blocos[0].itens.map((i) => i.pergunta);
    expect(new Set(perguntas).size).toBe(perguntas.length);
    expect(perguntas.length).toBeGreaterThanOrEqual(3);
  });

  it("não perde nenhuma pergunta em relação ao que a IA recebe", () => {
    const naTela = blocos.reduce((n, b) => n + b.itens.length, 0);
    const paraIA = formatDiagnosticInput(diagnostico).split("\n").filter((l) => l.startsWith("[")).length;
    // a única diferença é a intenção, que a IA recebe numa linha à parte e a tela mostra como pergunta
    expect(naTela).toBe(paraIA + 1);
  });

  it("os blocos que a IA recebe continuam com os títulos originais", () => {
    expect(formatDiagnosticInput(diagnostico)).toContain("BLOCO 2 — EVIDÊNCIAS REAIS");
  });
});
