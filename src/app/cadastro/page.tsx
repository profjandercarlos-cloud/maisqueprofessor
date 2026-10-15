import { AuthShell } from "@/components/auth-shell";
import { CadastroForm } from "./cadastro-form";

export default function CadastroPage() {
  return (
    <AuthShell
      title="Criar conta gratuita"
      subtitle="Explore pequenos negócios para ter uma renda extra fora da sala de aula."
    >
      <CadastroForm />
    </AuthShell>
  );
}
