import { describe, expect, it } from "vitest";
import { acaoSemSubstancia, avisosDeQualidade, lerMetaFinanceira, problemaNoTexto } from "./qualidade";

describe("problemas no texto (bloqueiam)", () => {
  it("aceita texto normal, curto ou longo", () => {
    expect(problemaNoTexto("Colegas me pedem planilhas de controle e eu monto para eles toda semana.", 80)).toBeNull();
    expect(problemaNoTexto("Mediação de conflitos entre equipes", 30)).toBeNull();
    expect(problemaNoTexto("")).toBeNull();
  });
  it("barra letras repetidas, mesmo que bata o mínimo de caracteres", () => {
    expect(problemaNoTexto("a".repeat(100), 80)).toMatch(/repetido/);
    expect(problemaNoTexto("eu fiz muito bem a minha parte!!!!!!!! e depois organizei tudo", 40)).toMatch(/repetido/);
  });
  it("barra a mesma palavra repetida para encher caracteres", () => {
    expect(problemaNoTexto("bom bom bom bom bom bom bom bom bom bom bom bom", 40)).toMatch(/repete/);
  });
  it("barra teclado amassado", () => {
    expect(problemaNoTexto("asdfghjkl kjhgfdsa sdfghjkl qwrtpsdf lkjhgfdsa zxcvbnm", 40)).toMatch(/reconhecer/);
  });
  it("exige palavras de verdade, não só caracteres", () => {
    expect(problemaNoTexto("organizacaoadministrativaeinstitucional", 80)).toMatch(/palavras/);
  });
  it("não confunde número, sigla e nome próprio com texto sem sentido", () => {
    expect(problemaNoTexto("Em 2019 fui voluntária no PTA da escola e organizei a rifa do bazar beneficente.", 60)).toBeNull();
  });
});

describe("ação sem substância", () => {
  it("pega respostas que não dizem o que a pessoa fez", () => {
    expect(acaoSemSubstancia("Eu ajudei a organizar e participei de tudo, dando apoio e suporte para todos")).toBe(true);
    expect(acaoSemSubstancia("ajudei")).toBe(true);
    expect(acaoSemSubstancia("Dei apoio ao time o tempo todo")).toBe(true);
  });
  it("deixa passar quando há o que foi feito", () => {
    expect(acaoSemSubstancia("Criei um modelo único de planilha e expliquei para cada colega")).toBe(false);
    expect(acaoSemSubstancia("Montei o cronograma da feira e negociei o espaço com a direção")).toBe(false);
  });
});

describe("meta financeira", () => {
  it("lê valor único, com R$, ponto de milhar e vírgula", () => {
    expect(lerMetaFinanceira("R$ 5.000")).toMatchObject({ minimo: 5000, maximo: 5000, anual: false });
    expect(lerMetaFinanceira("5000")).toMatchObject({ minimo: 5000, maximo: 5000 });
    expect(lerMetaFinanceira("R$ 4.000,50")).toMatchObject({ minimo: 4000.5, maximo: 4000.5 });
  });
  it("lê mil e k", () => {
    expect(lerMetaFinanceira("5 mil")).toMatchObject({ minimo: 5000 });
    expect(lerMetaFinanceira("5,5 mil")).toMatchObject({ minimo: 5500 });
    expect(lerMetaFinanceira("5k")).toMatchObject({ minimo: 5000 });
  });
  it("lê faixas, inclusive 'entre 4 e 6 mil' (o mil vale para os dois)", () => {
    expect(lerMetaFinanceira("entre R$ 4.000 e R$ 6.000")).toMatchObject({ minimo: 4000, maximo: 6000 });
    expect(lerMetaFinanceira("entre 4 e 6 mil")).toMatchObject({ minimo: 4000, maximo: 6000 });
    expect(lerMetaFinanceira("de 6000 a 4000")).toMatchObject({ minimo: 4000, maximo: 6000 });
  });
  it("devolve null quando não há valor e marca quando parece anual", () => {
    expect(lerMetaFinanceira("o que Deus quiser")).toBeNull();
    expect(lerMetaFinanceira("muito dinheiro")).toBeNull();
    expect(lerMetaFinanceira("60 mil por ano")?.anual).toBe(true);
  });
});

describe("avisos de qualidade (não bloqueiam)", () => {
  const base = (blocos: Record<string, Record<string, unknown>>) => blocos;

  it("sem respostas problemáticas, não há avisos", () => {
    expect(avisosDeQualidade({}, "CRIACAO_VALOR")).toEqual([]);
  });
  it("ajuda procurada que fala só de sala de aula", () => {
    const a = base({ blocoB: { ajudaProcurada: "Os alunos da minha turma me procuram para tirar dúvidas antes da prova." } });
    expect(avisosDeQualidade(a, "CRIACAO_VALOR").map((x) => x.slug)).toContain("ajuda-procurada");
  });
  it("experiência que é só consumo de conteúdo", () => {
    const a = base({ blocoB: { experienciasAlemDocencia: "Faço cursos online e assisto vídeos sobre empreender no YouTube." } });
    expect(avisosDeQualidade(a, "CRIACAO_VALOR").map((x) => x.slug)).toContain("experiencias-alem-docencia");
    const b = base({ blocoB: { experienciasAlemDocencia: "Vendi doces por encomenda em 2019 e cuidava de preço e entrega." } });
    expect(avisosDeQualidade(b, "CRIACAO_VALOR").map((x) => x.slug)).not.toContain("experiencias-alem-docencia");
  });
  it("contribuição que lista qualidades", () => {
    const a = base({ blocoB: { contribuicaoDiferenciada: "Sou criativa, responsável e muito comunicativa com todos." } });
    expect(avisosDeQualidade(a, "CRIACAO_VALOR").map((x) => x.slug)).toContain("contribuicao-diferenciada");
    const b = base({ blocoB: { contribuicaoDiferenciada: "Deixo tudo pronto antes, antecipo o que pode dar errado e monto um roteiro." } });
    expect(avisosDeQualidade(b, "CRIACAO_VALOR").map((x) => x.slug)).not.toContain("contribuicao-diferenciada");
  });
  it("aprendizado genérico", () => {
    const a = base({ blocoC: { aprendizadoDesejado: "Gostaria de aprender mais sobre tecnologia e coisas novas." } });
    expect(avisosDeQualidade(a, "CRIACAO_VALOR").map((x) => x.slug)).toContain("aprendizado-desejado");
  });
  it("meta financeira anual, baixa demais e sem valor", () => {
    const meta = (t: string) => base({ blocoEconomico: { metaFinanceiraMensal: t } });
    expect(avisosDeQualidade(meta("60 mil por ano"), "CRIACAO_VALOR")[0]?.motivo).toMatch(/por ano/);
    expect(avisosDeQualidade(meta("R$ 800"), "CRIACAO_VALOR")[0]?.motivo).toMatch(/baixo/);
    expect(avisosDeQualidade(meta("o que der"), "CRIACAO_VALOR")[0]?.motivo).toMatch(/valor em reais/);
    expect(avisosDeQualidade(meta("entre R$ 4.000 e R$ 6.000"), "CRIACAO_VALOR")).toEqual([]);
  });
  it("matriz de preferências toda igual", () => {
    const linhas = Object.fromEntries(
      ["atendimentoConstante", "exposicaoPublica", "vendas", "rendaVariavel", "rotinaRepetitiva", "trabalhoSentado"].map((k) => [k, "nao_aceito"]),
    );
    const a = base({ blocoD: { preferenciasEstruturais: linhas } });
    expect(avisosDeQualidade(a, "CRIACAO_VALOR")[0]?.slug).toBe("preferencias-estruturais");
  });
  it("contradição entre a rota e os formatos de trabalho", () => {
    const carreira = base({ blocoD: { formatosAceitos: ["negocio_proprio", "produto_proprio"] } });
    expect(avisosDeQualidade(carreira, "CARREIRA").map((x) => x.slug)).toContain("formatos-aceitos");
    const criacao = base({ blocoD: { formatosAceitos: ["empresa_privada", "setor_publico"] } });
    expect(avisosDeQualidade(criacao, "CRIACAO_VALOR").map((x) => x.slug)).toContain("formatos-aceitos");
    expect(avisosDeQualidade(criacao, "CARREIRA").map((x) => x.slug)).not.toContain("formatos-aceitos");
  });
  it("começar sozinho, mas não aceitar trabalhar sozinho", () => {
    const a = base({
      blocoRota: { criacaoFormaConstrucao: "sozinho_pequeno" },
      blocoD: { preferenciasEstruturais: { trabalhoSozinho: "nao_aceito" } },
    });
    expect(avisosDeQualidade(a, "CRIACAO_VALOR").map((x) => x.slug)).toContain("preferencias-estruturais");
  });
});
