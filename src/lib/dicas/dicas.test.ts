import { describe, expect, it } from "vitest";
import { CATEGORIAS_DICAS, IDS_DAS_CATEGORIAS } from "./categorias";
import {
  LIMIAR_NOVO_LOTE,
  TETO_DE_LOTES,
  deveAposentar,
  dicasNovas,
  escolherDica,
  pesoDaCategoria,
  precisaNovoLote,
} from "./escolher";
import { equilibrarPorCategoria, filtrarDicasGeradas, motivoDeRecusa, pareceRepetida, type DicaGerada } from "./gerar-lote";
import { DICAS_INICIAIS } from "./iniciais";

describe("banco inicial de dicas", () => {
  it("tem 60 dicas, com chaves únicas e todas as categorias representadas", () => {
    expect(DICAS_INICIAIS).toHaveLength(60);
    expect(new Set(DICAS_INICIAIS.map((d) => d.chave)).size).toBe(60);
    expect(new Set(DICAS_INICIAIS.map((d) => d.titulo)).size).toBe(60);
    for (const c of CATEGORIAS_DICAS) {
      expect(DICAS_INICIAIS.filter((d) => d.categoria === c.id).length, c.id).toBeGreaterThanOrEqual(6);
    }
  });
  it("toda dica está completa, com tamanho de leitura rápida e no formato 'Se..., então...'", () => {
    for (const d of DICAS_INICIAIS) {
      expect(IDS_DAS_CATEGORIAS, d.chave).toContain(d.categoria);
      expect(d.titulo.length, d.chave).toBeGreaterThanOrEqual(8);
      expect(d.titulo.length, d.chave).toBeLessThanOrEqual(80);
      expect(d.texto.length, d.chave).toBeGreaterThanOrEqual(80);
      expect(d.texto.length, d.chave).toBeLessThanOrEqual(420);
      expect(d.tenteHoje, d.chave).toMatch(/^Se .+, então .+\.$/);
      expect(d.tenteHoje.length, d.chave).toBeLessThanOrEqual(240);
    }
  });
  it("respeita o estilo: sem travessão, sem promessa de renda e sem culpa", () => {
    for (const d of DICAS_INICIAIS) {
      const tudo = `${d.titulo} ${d.texto} ${d.tenteHoje} ${d.ideia ?? ""}`;
      expect(tudo, d.chave).not.toMatch(/[—–]/);
      expect(tudo, d.chave).not.toMatch(/\b(garant\w+|ficar rico|enriquec\w+|dinheiro fácil)\b/i);
      expect(motivoDeRecusa({ categoria: d.categoria, titulo: d.titulo, texto: d.texto, tente_hoje: d.tenteHoje, ideia: d.ideia ?? null }), d.chave).toBeNull();
    }
  });
});

describe("escolha da dica do dia", () => {
  const ativas = [
    { id: "a", categoria: "comecar" },
    { id: "b", categoria: "foco" },
    { id: "c", categoria: "medo" },
  ];
  const base = { guardadas: new Set<string>(), guardadasPorCategoria: {}, dispensadasPorCategoria: {} };

  it("só entrega dicas que a pessoa ainda não recebeu", () => {
    for (const sorteio of [0, 0.3, 0.6, 0.99]) {
      const e = escolherDica({ ...base, ativas, recebidas: [{ dicaId: "a", dia: "2026-11-01" }, { dicaId: "b", dia: "2026-11-02" }], sorteio });
      expect(e).toEqual({ dicaId: "c", tipo: "nova" });
    }
  });
  it("com várias dicas novas, o sorteio alcança todas", () => {
    const sorteadas = new Set([0, 0.4, 0.7, 0.99].map((s) => escolherDica({ ...base, ativas, recebidas: [], sorteio: s })!.dicaId));
    expect(sorteadas).toEqual(new Set(["a", "b", "c"]));
  });
  it("dica aposentada nunca é sorteada (quem manda só as ativas)", () => {
    expect(dicasNovas([{ id: "a", categoria: "x" }], new Set(["a"]))).toEqual([]);
  });
  it("temas que a pessoa mais guarda ganham peso e os mais dispensados perdem, sem zerar", () => {
    expect(pesoDaCategoria(0, 0)).toBe(1);
    expect(pesoDaCategoria(4, 0)).toBe(3);
    expect(pesoDaCategoria(0, 2)).toBe(0.5);
    expect(pesoDaCategoria(0, 100)).toBe(0.25);
  });
  it("o peso desloca o sorteio para o tema mais guardado", () => {
    const pesado = { ...base, guardadasPorCategoria: { foco: 6 } }; // peso 4 contra 1 e 1
    const escolhas = [0.2, 0.5, 0.7].map((s) => escolherDica({ ...pesado, ativas, recebidas: [], sorteio: s })!.dicaId);
    expect(escolhas.filter((id) => id === "b").length).toBeGreaterThanOrEqual(2);
  });
  it("sem dica nova, revisita a que ela viu há mais tempo, preferindo as guardadas", () => {
    const recebidas = [
      { dicaId: "a", dia: "2026-10-01" },
      { dicaId: "b", dia: "2026-10-05" },
      { dicaId: "c", dia: "2026-10-09" },
    ];
    expect(escolherDica({ ...base, ativas, recebidas })).toEqual({ dicaId: "a", tipo: "revisita" });
    expect(escolherDica({ ...base, guardadas: new Set(["b", "c"]), ativas, recebidas })).toEqual({ dicaId: "b", tipo: "revisita" });
  });
  it("devolve null só quando não há nenhuma dica no banco nem histórico", () => {
    expect(escolherDica({ ...base, ativas: [], recebidas: [] })).toBeNull();
  });
});

describe("geração automática de lotes", () => {
  const livre = { lotesAutomaticosConcluidos: 0, emAndamento: false, falhouHaPouco: false };

  it("pede um lote novo quando restam LIMIAR dicas ou menos, e não antes", () => {
    expect(precisaNovoLote({ ...livre, restantes: LIMIAR_NOVO_LOTE + 1 })).toBe(false);
    expect(precisaNovoLote({ ...livre, restantes: LIMIAR_NOVO_LOTE })).toBe(true);
    expect(precisaNovoLote({ ...livre, restantes: 0 })).toBe(true);
  });
  it("não gera se já há um lote em andamento, se falhou há pouco ou se chegou ao teto de lotes", () => {
    expect(precisaNovoLote({ ...livre, restantes: 3, emAndamento: true })).toBe(false);
    expect(precisaNovoLote({ ...livre, restantes: 3, falhouHaPouco: true })).toBe(false);
    expect(precisaNovoLote({ ...livre, restantes: 3, lotesAutomaticosConcluidos: TETO_DE_LOTES })).toBe(false);
    expect(precisaNovoLote({ ...livre, restantes: 3, lotesAutomaticosConcluidos: TETO_DE_LOTES - 1 })).toBe(true);
  });
  it("aposenta dica muito dispensada, mas só com amostra suficiente", () => {
    expect(deveAposentar({ vistas: 10, dispensadas: 10 })).toBe(false);
    expect(deveAposentar({ vistas: 20, dispensadas: 11 })).toBe(false);
    expect(deveAposentar({ vistas: 20, dispensadas: 12 })).toBe(true);
    expect(deveAposentar({ vistas: 100, dispensadas: 30 })).toBe(false);
  });
});

describe("filtro das dicas geradas pela IA", () => {
  const boa: DicaGerada = {
    categoria: "foco",
    titulo: "Termine o que começou hoje",
    texto:
      "Você abre três tarefas e não termina nenhuma? Cada troca de tarefa gasta atenção. Fechar uma antes de abrir a seguinte devolve a sensação de avanço.",
    tente_hoje: "Se eu abrir uma ação do plano, então só passo para outra quando marcar esta como feita.",
    ideia: null,
  };

  it("aceita uma dica no formato certo", () => {
    expect(motivoDeRecusa(boa)).toBeNull();
  });
  it("recusa categoria inventada, formato errado do 'tente hoje' e tamanhos fora do limite", () => {
    expect(motivoDeRecusa({ ...boa, categoria: "inventada" })).toBe("categoria desconhecida");
    expect(motivoDeRecusa({ ...boa, tente_hoje: "Faça uma pausa de cinco minutos hoje mesmo." })).toMatch(/Se\.\.\./);
    expect(motivoDeRecusa({ ...boa, tente_hoje: "Se eu abrir o plano, faço um item agora mesmo." })).toMatch(/Se\.\.\./);
    expect(motivoDeRecusa({ ...boa, texto: "Curto demais." })).toBe("texto fora do tamanho");
    expect(motivoDeRecusa({ ...boa, titulo: "Oi" })).toBe("título fora do tamanho");
  });
  it("recusa travessão, promessa de renda, conselho clínico e incentivo a largar o emprego ou se endividar", () => {
    expect(motivoDeRecusa({ ...boa, texto: boa.texto + " Isso ajuda — muito." })).toBe("texto proibido");
    expect(motivoDeRecusa({ ...boa, texto: boa.texto + " É um caminho garantido para ficar rico." })).toBe("texto proibido");
    expect(motivoDeRecusa({ ...boa, texto: boa.texto + " Procure terapia se a ansiedade clínica aparecer." })).toBe("texto proibido");
    expect(motivoDeRecusa({ ...boa, texto: boa.texto + " Largue o emprego e dedique-se a isso." })).toBe("texto proibido");
    expect(motivoDeRecusa({ ...boa, texto: boa.texto + " Se for preciso, faça um empréstimo." })).toBe("texto proibido");
  });
  it("descarta repetidas do banco e do próprio lote, e respeita o máximo", () => {
    const existentes = [{ titulo: DICAS_INICIAIS[0].titulo, texto: DICAS_INICIAIS[0].texto }];
    const copia: DicaGerada = { ...boa, titulo: DICAS_INICIAIS[0].titulo, categoria: "comecar" };
    expect(pareceRepetida(copia, existentes)).toBe(true);
    expect(pareceRepetida(boa, existentes)).toBe(false);

    const r = filtrarDicasGeradas([boa, boa, copia], existentes);
    expect(r.aprovadas).toHaveLength(1);
    expect(r.recusadas.map((x) => x.motivo)).toEqual(["repetida", "repetida"]);

    const muitas = Array.from({ length: 5 }, (_, i) => ({
      ...boa,
      titulo: `Titulo totalmente diferente numero ${i} sobre ${["agenda", "vendas", "preco", "tempo", "ideia"][i]}`,
      texto: `${["Agenda", "Vendas", "Preço", "Tempo", "Ideia"][i]}: ${boa.texto.replace(/[a-z]+/gi, (m, k) => (k % 2 ? m : m.split("").reverse().join("")))}`,
    }));
    expect(filtrarDicasGeradas(muitas, [], 3).aprovadas.length).toBeLessThanOrEqual(3);
  });
  it("equilibra o lote entre as categorias, em vez de ficar com as primeiras da fila", () => {
    const dicas = [
      ...Array.from({ length: 6 }, (_, i) => ({ categoria: "foco", n: i })),
      ...Array.from({ length: 2 }, (_, i) => ({ categoria: "preco", n: i })),
      ...Array.from({ length: 3 }, (_, i) => ({ categoria: "medo", n: i })),
    ];
    const lote = equilibrarPorCategoria(dicas, 6);
    expect(lote).toHaveLength(6);
    expect(lote.filter((d) => d.categoria === "preco")).toHaveLength(2);
    expect(lote.filter((d) => d.categoria === "medo")).toHaveLength(2);
    expect(lote.filter((d) => d.categoria === "foco")).toHaveLength(2);
    expect(equilibrarPorCategoria(dicas, 50)).toHaveLength(11); // nunca inventa dicas
  });
  it("limpa o título (ponto final) e a ideia vazia", () => {
    const r = filtrarDicasGeradas([{ ...boa, titulo: "Termine o que começou hoje.", ideia: "  " }], []);
    expect(r.aprovadas[0].titulo).toBe("Termine o que começou hoje");
    expect(r.aprovadas[0].ideia).toBeNull();
  });
});
