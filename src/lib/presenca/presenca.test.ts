import { describe, expect, it } from "vitest";
import { chaveDoMes, lerMes, mesVizinho, montarMes } from "./calendario";
import { dataParaDia, diaLocal, diaParaData, diasEntre, situacaoDePresenca, somarDias } from "./dias";
import { conjuntoDeMensagens, escolherMensagem, faixaDeRetorno, mensagemPorId, preencherMensagem } from "./escolher-mensagem";
import {
  LIMIARES_SEGUIDOS,
  MARCOS_TOTAIS,
  MENSAGENS_MARCOS,
  MENSAGENS_PRIMEIRA,
  MENSAGENS_RETORNO,
  MENSAGENS_SEGUIDOS,
} from "./mensagens";

describe("dia à meia-noite de Brasília", () => {
  it("23h59 em Brasília ainda é o mesmo dia e 00h00 já é o seguinte (o servidor roda em UTC)", () => {
    expect(diaLocal(new Date("2026-11-03T02:59:00Z"))).toBe("2026-11-02"); // 23h59 BRT
    expect(diaLocal(new Date("2026-11-03T03:00:00Z"))).toBe("2026-11-03"); // 00h00 BRT
  });
  it("converte de ida e volta com a coluna DATE e soma dias atravessando o mês", () => {
    expect(dataParaDia(diaParaData("2026-11-05"))).toBe("2026-11-05");
    expect(somarDias("2026-11-30", 1)).toBe("2026-12-01");
    expect(somarDias("2026-03-01", -1)).toBe("2026-02-28");
    expect(diasEntre("2026-10-30", "2026-11-02")).toBe(3);
  });
});

describe("situação de presença", () => {
  it("primeira vez: total 1, 1 seguido, sem ausência", () => {
    expect(situacaoDePresenca([], "2026-11-10")).toEqual({ total: 1, seguidos: 1, diasAusente: null });
  });
  it("veio ontem e hoje: 2 seguidos, nenhum dia de ausência", () => {
    expect(situacaoDePresenca(["2026-11-09"], "2026-11-10")).toEqual({ total: 2, seguidos: 2, diasAusente: 0 });
  });
  it("conta os dias seguidos só até a primeira falha", () => {
    const s = situacaoDePresenca(["2026-11-01", "2026-11-02", "2026-11-04", "2026-11-05", "2026-11-06"], "2026-11-07");
    expect(s.seguidos).toBe(4); // 4, 5, 6 e hoje
    expect(s.total).toBe(6);
  });
  it("mede a ausência em dias sem presença entre a última vez e hoje", () => {
    expect(situacaoDePresenca(["2026-11-01"], "2026-11-05").diasAusente).toBe(3); // 2, 3 e 4
    expect(situacaoDePresenca(["2026-10-01"], "2026-11-05").diasAusente).toBe(34);
  });
  it("o total nunca diminui e ignora repetidos e dias de hoje ou futuros", () => {
    const s = situacaoDePresenca(["2026-11-09", "2026-11-09", "2026-11-10", "2026-11-12"], "2026-11-10");
    expect(s.total).toBe(2);
  });
});

describe("mensagens de incentivo", () => {
  const sit = (total: number, seguidos: number, diasAusente: number | null) => ({ total, seguidos, diasAusente });

  it("primeira presença tem mensagem própria", () => {
    expect(conjuntoDeMensagens(sit(1, 1, null))).toBe(MENSAGENS_PRIMEIRA);
  });
  it("só aparece em momentos especiais: o dia comum não tem mensagem", () => {
    expect(conjuntoDeMensagens(sit(12, 4, 0))).toBeNull();
    expect(conjuntoDeMensagens(sit(12, 1, 1))).toBeNull(); // faltar 1 ou 2 dias é normal
    expect(conjuntoDeMensagens(sit(13, 1, 2))).toBeNull();
  });
  it("dias seguidos: cada limiar tem a sua mensagem e depois de 30 repete a cada 30", () => {
    expect(conjuntoDeMensagens(sit(5, 5, 0))).toBe(MENSAGENS_SEGUIDOS[5]);
    expect(conjuntoDeMensagens(sit(44, 30, 0))).toBe(MENSAGENS_SEGUIDOS[30]);
    expect(conjuntoDeMensagens(sit(76, 60, 0))).toBe(MENSAGENS_SEGUIDOS[30]);
    expect(conjuntoDeMensagens(sit(75, 45, 0))).toBeNull();
  });
  it("volta depois de um tempo: as faixas de 3-6, 7-13, 14-29 e 30+ dias", () => {
    expect(faixaDeRetorno(2)).toBeNull();
    expect(faixaDeRetorno(3)).toBe("curto");
    expect(faixaDeRetorno(6)).toBe("curto");
    expect(faixaDeRetorno(7)).toBe("semana");
    expect(faixaDeRetorno(14)).toBe("quinzena");
    expect(faixaDeRetorno(29)).toBe("quinzena");
    expect(faixaDeRetorno(30)).toBe("mes");
    expect(conjuntoDeMensagens(sit(20, 1, 9))).toBe(MENSAGENS_RETORNO.semana);
  });
  it("marco do contador total tem prioridade sobre a volta e sobre dias seguidos", () => {
    expect(conjuntoDeMensagens(sit(30, 1, 10))).toBe(MENSAGENS_MARCOS[30]);
    expect(conjuntoDeMensagens(sit(100, 7, 0))).toBe(MENSAGENS_MARCOS[100]);
  });

  it("todo limiar e todo marco anunciados têm mensagens", () => {
    for (const l of LIMIARES_SEGUIDOS) expect(MENSAGENS_SEGUIDOS[l]?.length, `seguidos ${l}`).toBeGreaterThanOrEqual(3);
    for (const m of MARCOS_TOTAIS) expect(MENSAGENS_MARCOS[m]?.length, `marco ${m}`).toBeGreaterThanOrEqual(2);
    for (const f of Object.values(MENSAGENS_RETORNO)) expect(f.length).toBeGreaterThanOrEqual(5);
  });
  it("os textos não têm travessão, ids repetidos nem marcador desconhecido, e nenhum cobra culpa", () => {
    const todas = [
      ...MENSAGENS_PRIMEIRA,
      ...Object.values(MENSAGENS_SEGUIDOS).flat(),
      ...Object.values(MENSAGENS_RETORNO).flat(),
      ...Object.values(MENSAGENS_MARCOS).flat(),
    ];
    expect(new Set(todas.map((m) => m.id)).size).toBe(todas.length);
    for (const m of todas) {
      expect(m.texto, m.id).not.toMatch(/[—–]/);
      expect(m.texto, m.id).not.toMatch(/\{(?!nome\}|dias\}|seguidos\}|proxima\})/);
      expect(m.texto, m.id).not.toMatch(/\b(culpa|falhou|perdeu sua|preguiç|desistiu)\b/i);
      if (m.texto.includes("{proxima}")) expect(m.usaProxima, m.id).toBe(true);
    }
  });

  it("nunca repete a mensagem anterior quando há outra opção", () => {
    for (const anterior of MENSAGENS_SEGUIDOS[5].map((m) => m.id)) {
      for (const sorteio of [0, 0.34, 0.67, 0.99]) {
        const m = escolherMensagem(sit(5, 5, 0), { nome: "Ana", anteriorId: anterior, sorteio });
        expect(m?.id).not.toBe(anterior);
      }
    }
  });
  it("só usa versões com a próxima ação quando a pessoa tem uma", () => {
    for (const sorteio of [0, 0.2, 0.4, 0.6, 0.8, 0.99]) {
      const m = escolherMensagem(sit(20, 1, 4), { nome: "Ana", sorteio });
      expect(m?.texto).not.toContain('""');
      expect(m?.texto).not.toContain("{proxima}");
    }
    const com = escolherMensagem(sit(20, 1, 4), { nome: "Ana", proxima: "Apresentar proposta", sorteio: 0 });
    expect(com?.texto).toContain('"Apresentar proposta"');
  });
  it("preenche nome, dias e seguidos; sem nome, a frase continua correta", () => {
    const dados = { dias: 30, seguidos: 3, proxima: null };
    expect(preencherMensagem("Trinta dias de presença, {nome}. Quanta coisa já foi feita.", { ...dados, nome: "Ana Paula" })).toBe(
      "Trinta dias de presença, Ana. Quanta coisa já foi feita.",
    );
    expect(preencherMensagem("Trinta dias de presença, {nome}. Quanta coisa já foi feita.", { ...dados, nome: null })).toBe(
      "Trinta dias de presença. Quanta coisa já foi feita.",
    );
    expect(preencherMensagem("{nome}, o seu plano ficou guardado.", { ...dados, nome: "" })).toBe("O seu plano ficou guardado.");
    expect(preencherMensagem("Dia {dias}.", { ...dados, nome: "Ana" })).toBe("Dia 30.");
  });
  it("reencontra a mensagem pelo id guardado", () => {
    expect(mensagemPorId("s5-1")?.texto).toContain("Cinco dias seguidos");
    expect(mensagemPorId("nao-existe")).toBeNull();
    expect(mensagemPorId(null)).toBeNull();
  });
});

describe("calendário do mês", () => {
  it("monta semanas de 7, com o dia 1 no dia da semana certo (domingo primeiro)", () => {
    // 1º de novembro de 2026 é domingo
    const semanas = montarMes(2026, 11, new Set(), "2026-11-10");
    expect(semanas.every((s) => s.length === 7)).toBe(true);
    expect(semanas[0][0]?.numero).toBe(1);
    // 1º de dezembro de 2026 é terça: duas células vazias antes
    const dez = montarMes(2026, 12, new Set(), "2026-11-10");
    expect(dez[0].slice(0, 2)).toEqual([null, null]);
    expect(dez[0][2]?.numero).toBe(1);
  });
  it("marca só os dias presentes, o dia de hoje e o futuro; ausência não ganha marca", () => {
    const celulas = montarMes(2026, 11, new Set(["2026-11-02", "2026-11-09"]), "2026-11-10").flat().filter(Boolean);
    expect(celulas.filter((c) => c!.presente).map((c) => c!.numero)).toEqual([2, 9]);
    expect(celulas.find((c) => c!.hoje)?.numero).toBe(10);
    expect(celulas.find((c) => c!.numero === 11)?.futuro).toBe(true);
    expect(celulas.find((c) => c!.numero === 5)?.futuro).toBe(false);
    expect(celulas).toHaveLength(30);
  });
  it("lê o mês da URL com segurança e anda para o anterior e o seguinte atravessando o ano", () => {
    expect(lerMes("2026-09", "2026-11-10")).toEqual({ ano: 2026, mes: 9 });
    expect(lerMes("lixo", "2026-11-10")).toEqual({ ano: 2026, mes: 11 });
    expect(lerMes("2026-13", "2026-11-10")).toEqual({ ano: 2026, mes: 11 });
    expect(lerMes(undefined, "2026-11-10")).toEqual({ ano: 2026, mes: 11 });
    expect(mesVizinho(2026, 1, -1)).toEqual({ ano: 2025, mes: 12 });
    expect(mesVizinho(2026, 12, 1)).toEqual({ ano: 2027, mes: 1 });
    expect(chaveDoMes(2026, 3)).toBe("2026-03");
  });
});
