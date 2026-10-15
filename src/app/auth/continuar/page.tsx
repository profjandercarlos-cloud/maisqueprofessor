import { AuthShell } from "@/components/auth-shell";
import { SubmitButton } from "@/components/submit-button";
import { confirmarLink } from "./actions";

// Tela intermediária do link de e-mail: o token só é gasto quando a pessoa
// clica no botão. Abrir a página (ou um verificador automático de links
// fazendo GET) não consome nada.
export default async function ContinuarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const valor = (k: string) => (typeof query[k] === "string" ? (query[k] as string) : "");
  const tokenHash = valor("token_hash");
  const type = valor("type");
  const next = valor("next");

  if (!tokenHash || !type) {
    return (
      <AuthShell title="Link inválido" subtitle="Este link está incompleto.">
        <a href="/login" className="text-sm font-semibold text-petrol hover:underline">
          Ir para o login
        </a>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Confirme seu e-mail" subtitle="Falta só um clique para continuar.">
      <form action={confirmarLink} className="flex flex-col gap-4">
        <input type="hidden" name="token_hash" value={tokenHash} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="next" value={next} />
        <SubmitButton
          pendingText="Confirmando..."
          className="rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
        >
          Continuar
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
