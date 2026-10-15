// Estado de acesso de uma conta. Função pura, de propósito — é a definição
// única de "pago" usada pelo guard das páginas, pelo menu e pelo admin.
//
// - pago: tem validade futura e não foi revogado (admin conta como pago).
// - expirado: já foi pago (tem validade) mas venceu, ou foi revogado.
// - gratuito: conta sem validade nenhuma — só a compra preenche accessExpiresAt.
export type TipoAcesso = "pago" | "expirado" | "gratuito";

export type EstadoConta = {
  accessExpiresAt: Date | null;
  accessRevokedAt: Date | null;
  isAdmin: boolean;
};

export function tipoDeAcesso(conta: EstadoConta | null | undefined, agora: Date = new Date()): TipoAcesso {
  if (!conta) return "gratuito";
  if (conta.isAdmin) return "pago";
  if (conta.accessRevokedAt) return "expirado";
  if (!conta.accessExpiresAt) return "gratuito";
  return conta.accessExpiresAt > agora ? "pago" : "expirado";
}

export function temAcessoPago(conta: EstadoConta | null | undefined, agora: Date = new Date()): boolean {
  return tipoDeAcesso(conta, agora) === "pago";
}
