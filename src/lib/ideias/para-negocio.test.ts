import { describe, expect, it } from "vitest";
import repositorio from "@/data/repositorio-ideias.json";
import { donoDoNegocio } from "@/lib/plano/dono-do-negocio";
import { conteudoSchema } from "./conteudo";
import { prepararImportacao } from "./importar";
import { negocioDeIdeia } from "./para-negocio";

describe("ideia favoritada vira negócio do plano", () => {
  const { ideias } = prepararImportacao(repositorio);

  it("toda ideia do repositório gera um negócio com os textos preenchidos", () => {
    for (const i of ideias) {
      const n = negocioDeIdeia(conteudoSchema.parse(i.conteudo));
      expect(n.papel).toBe("IDEIA_DO_CATALOGO");
      for (const campo of [n.titulo, n.subtitulo, n.comoFunciona, n.comoGerarReceita, n.porQueCombinaComVoce, n.primeiraValidacao, n.pontoDeAtencao]) {
        expect(campo.trim().length, i.origemId).toBeGreaterThan(0);
      }
      // nunca A_VALIDAR: o banco exige um horizonte real para o primeiro retorno
      expect(n.tempoPrimeiraValidacao).not.toBe("A_VALIDAR");
    }
  });

  it("o primeiro serviço do negócio é a oferta + o plano inicial da ideia", () => {
    const c = conteudoSchema.parse(ideias[0].conteudo);
    const n = negocioDeIdeia(c);
    expect(n.primeiraValidacao).toBe(`${c.primeiroServico.oferta} ${c.primeiroServico.plano}`);
  });
});

describe("dono do negócio", () => {
  it("negócio de favorito é de quem o criou; o da rodada é do dono do diagnóstico", () => {
    expect(donoDoNegocio({ userId: "u1", round: null })).toBe("u1");
    expect(donoDoNegocio({ userId: null, round: { diagnostic: { userId: "u2" } } })).toBe("u2");
    expect(donoDoNegocio({ userId: null, round: null })).toBeNull();
  });
});
