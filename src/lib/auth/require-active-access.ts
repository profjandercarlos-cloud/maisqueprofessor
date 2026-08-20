import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

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

// Mesma coisa, mas também bloqueia quem está com acesso revogado/expirado —
// para as páginas "de produto" (diagnóstico, possibilidades, planos). As
// Configurações não usam isto: precisam continuar acessíveis mesmo sem
// acesso ativo, para a pessoa ver o status e poder sair da conta.
export async function requireActiveAccess(): Promise<User> {
  const user = await requireUser();
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { accessRevokedAt: true },
  });
  if (dbUser?.accessRevokedAt) {
    redirect("/acesso-expirado");
  }
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
