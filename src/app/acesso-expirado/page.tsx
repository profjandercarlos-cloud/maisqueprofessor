import { AppHeader } from "@/components/app-header";
import { LogoutButton } from "@/app/logout-button";

export default function AcessoExpiradoPage() {
  return (
    <div className="mx-auto w-full max-w-[600px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="ACESSO EXPIRADO" />
      <h1 className="mb-3 font-serif text-2xl font-medium tracking-tight text-petrol">
        Seu acesso expirou.
      </h1>
      <p className="mb-7 text-[14.5px] text-ink-muted">
        Seus dados continuam salvos — diagnóstico, planos e diário não foram apagados. Renove sua
        compra para voltar a acessar tudo.
      </p>
      <div className="flex items-center gap-4">
        <a
          href="/configuracoes"
          className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
        >
          Ver status de acesso
        </a>
        <LogoutButton />
      </div>
    </div>
  );
}
