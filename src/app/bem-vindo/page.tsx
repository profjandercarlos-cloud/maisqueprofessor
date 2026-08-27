import { AuthShell } from "@/components/auth-shell";

// Página de redirecionamento pós-compra da Hotmart. Não recebe nenhum token
// na URL — só orienta o comprador a checar o e-mail (disparado pelo webhook
// da Hotmart de forma assíncrona) para criar a senha e acessar o app.
export default function BemVindoPage() {
  return (
    <AuthShell title="Compra confirmada!" subtitle="Falta só um passo para você começar.">
      <div className="flex flex-col gap-4 text-[14.5px] text-ink">
        <p>
          Em instantes você vai receber um e-mail nosso com um link para criar sua senha
          de acesso.
        </p>
        <p className="text-ink-muted">
          Não achou a mensagem? Confira a caixa de spam ou promoções.
        </p>
        <a
          href="/esqueci-senha"
          className="mt-2 self-start rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
        >
          Reenviar link de acesso →
        </a>
      </div>
    </AuthShell>
  );
}
