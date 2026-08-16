import { AuthShell } from "@/components/auth-shell";
import { SetPasswordForm } from "./set-password-form";

export default function SetPasswordPage() {
  return (
    <AuthShell
      title="Defina sua senha"
      subtitle="Escolha uma senha para acessar sua conta daqui em diante."
    >
      <SetPasswordForm />
    </AuthShell>
  );
}
