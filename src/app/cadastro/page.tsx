import { AuthShell } from "@/components/auth-shell";
import { CadastroForm } from "./cadastro-form";

export default function CadastroPage() {
  return (
    <AuthShell
      title="Criar conta gratuita"
      subtitle="Explore ideias de negócios para professores."
    >
      <CadastroForm />
    </AuthShell>
  );
}
