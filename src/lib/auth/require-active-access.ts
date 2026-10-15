import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { tipoDeAcesso, temAcessoPago, type TipoAcesso } from "./acesso";

// Substitui o padrão repetido de "pega o usuário, redireciona pro /login se
// não tiver sessão". Roda em Server Components/Actions (runtime Node.js
// normal) — nunca no proxy, que não suporta os módulos nativos do driver do
// Postgres (ver nota em src/proxy.ts).
export async function requireUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}

export async function getTipoAcesso(userId: string): Promise<TipoAcesso> {
  const dbUser = await db.user.findUnique({
    where: { id: userId },
    select: { accessExpiresAt: true, accessRevokedAt: true, isAdmin: true },
  });
  return tipoDeAcesso(dbUser);
}

// Mesma coisa, mas só deixa passar quem tem acesso PAGO — para as páginas
// "de produto" (diagnóstico, possibilidades, planos). Conta gratuita (sem
// validade, só criada pelo cadastro) vai para a página de compra; quem já
// pagou e venceu/foi revogado vai para /acesso-expirado. As Configurações
// não usam isto: precisam continuar acessíveis para a pessoa ver o status e
// poder sair da conta.
export async function requireActiveAccess(opcoes?: { gratuitoVaiPara?: string }): Promise<User> {
  const user = await requireUser();
  const tipo = await getTipoAcesso(user.id);
  if (tipo === "expirado") redirect("/acesso-expirado");
  if (tipo === "gratuito") redirect(opcoes?.gratuitoVaiPara ?? "/area-bloqueada");
  return user;
}

// Área /admin — independe de accessExpiresAt/accessRevokedAt (a Hotmart não
// tem nada a ver com o papel de administrador). Quem não for admin nem
// percebe que a rota existe: cai direto na Home.
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { isAdmin: true },
  });
  if (!dbUser?.isAdmin) {
    redirect("/");
  }
  return user;
}

// Usada só pelo layout raiz, pra decidir se mostra a navegação lateral fixa
// em toda tela logada — nunca redireciona (o layout raiz também renderiza
// páginas públicas como /login), só devolve null sem sessão.
export async function getNavContext(): Promise<{ isAdmin: boolean; pago: boolean } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { isAdmin: true, accessExpiresAt: true, accessRevokedAt: true },
  });
  return { isAdmin: dbUser?.isAdmin ?? false, pago: temAcessoPago(dbUser) };
}
