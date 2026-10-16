// Link de compra do Plano Prof+ na Hotmart. A URL vem de
// NEXT_PUBLIC_HOTMART_CHECKOUT_URL (não existe link de checkout no código).
// Anexa e-mail e nome como parâmetros pra o formulário da Hotmart já vir
// preenchido — assim a compra cai no mesmo e-mail da conta gratuita e a conta
// vira paga em vez de duplicar. Retorna null sem a env: a tela esconde o botão.
export function montarLinkCompra(email?: string | null, nome?: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_HOTMART_CHECKOUT_URL;
  if (!base) return null;
  try {
    const url = new URL(base);
    if (email) url.searchParams.set("email", email);
    if (nome) url.searchParams.set("name", nome);
    return url.toString();
  } catch {
    return null;
  }
}
