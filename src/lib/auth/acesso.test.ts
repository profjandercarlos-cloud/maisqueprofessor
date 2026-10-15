import { describe, expect, it } from "vitest";
import { temAcessoPago, tipoDeAcesso } from "./acesso";

const agora = new Date("2026-10-15T12:00:00Z");
const futuro = new Date("2027-01-01T00:00:00Z");
const passado = new Date("2026-01-01T00:00:00Z");

describe("tipoDeAcesso", () => {
  it("conta inexistente é gratuita", () => {
    expect(tipoDeAcesso(null, agora)).toBe("gratuito");
  });

  it("sem validade é gratuita", () => {
    expect(tipoDeAcesso({ accessExpiresAt: null, accessRevokedAt: null, isAdmin: false }, agora)).toBe("gratuito");
  });

  it("validade futura e sem revogação é paga", () => {
    expect(tipoDeAcesso({ accessExpiresAt: futuro, accessRevokedAt: null, isAdmin: false }, agora)).toBe("pago");
  });

  it("validade vencida é expirada, mesmo antes do cron revogar", () => {
    expect(tipoDeAcesso({ accessExpiresAt: passado, accessRevokedAt: null, isAdmin: false }, agora)).toBe("expirado");
  });

  it("revogada é expirada, mesmo com validade futura", () => {
    expect(tipoDeAcesso({ accessExpiresAt: futuro, accessRevokedAt: passado, isAdmin: false }, agora)).toBe("expirado");
  });

  it("revogada e sem validade também é expirada (não volta a ser gratuita)", () => {
    expect(tipoDeAcesso({ accessExpiresAt: null, accessRevokedAt: passado, isAdmin: false }, agora)).toBe("expirado");
  });

  it("admin sempre conta como pago", () => {
    expect(tipoDeAcesso({ accessExpiresAt: null, accessRevokedAt: null, isAdmin: true }, agora)).toBe("pago");
    expect(tipoDeAcesso({ accessExpiresAt: passado, accessRevokedAt: passado, isAdmin: true }, agora)).toBe("pago");
  });
});

describe("temAcessoPago", () => {
  it("só é verdadeiro para o tipo pago", () => {
    expect(temAcessoPago({ accessExpiresAt: futuro, accessRevokedAt: null, isAdmin: false }, agora)).toBe(true);
    expect(temAcessoPago({ accessExpiresAt: null, accessRevokedAt: null, isAdmin: false }, agora)).toBe(false);
    expect(temAcessoPago(null, agora)).toBe(false);
  });
});
