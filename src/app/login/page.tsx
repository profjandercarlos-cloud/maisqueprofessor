import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;

  return (
    <AuthShell title="Entrar" subtitle="Acesse sua conta para continuar seu plano.">
      <LoginForm next={next} />
    </AuthShell>
  );
}
