import { describe, expect, it } from "vitest";
import { LIMITE_PLANOS, cotaDePlanos } from "./cota";

describe("cotaDePlanos", () => {
  it("o limite é 5", () => {
    expect(LIMITE_PLANOS).toBe(5);
  });

  it("mostra quantos foram usados e quantos restam", () => {
    expect(cotaDePlanos(0)).toEqual({ usados: 0, limite: 5, restantes: 5, esgotada: false });
    expect(cotaDePlanos(3)).toEqual({ usados: 3, limite: 5, restantes: 2, esgotada: false });
  });

  it("esgota exatamente no quinto plano e nunca fica negativa", () => {
    expect(cotaDePlanos(4).esgotada).toBe(false);
    expect(cotaDePlanos(5)).toEqual({ usados: 5, limite: 5, restantes: 0, esgotada: true });
    expect(cotaDePlanos(8).restantes).toBe(0);
  });
});
