import { AppHeader } from "@/components/app-header";
import { SubmitButton } from "@/components/submit-button";
import { generateForActiveDiagnostic } from "./actions";

// Sem isto, a Vercel mata a função depois de 10s (padrão do plano Hobby) —
// e a geração das 5 possibilidades leva de 15s a mais de 1 minuto. 60 é o
// teto permitido no Hobby; se continuar estourando, só resolve de vez com
// upgrade pra Pro (até 300s).
export const maxDuration = 60;

export default async function DiagnosticoConcluidoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  return (
    <div className="mx-auto w-full max-w-[680px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="DIAGNÓSTICO CONCLUÍDO" />
      <div>
        <span className="mb-[18px] inline-block rounded-full bg-badge-bg px-2.5 py-[5px] font-mono text-[11px] tracking-[0.12em] text-badge-text uppercase">
          Diagnóstico concluído
        </span>
        <h1 className="mb-3.5 font-serif text-[clamp(26px,5vw,34px)] leading-[1.15] font-medium tracking-tight text-petrol">
          Suas respostas foram salvas.
        </h1>
        <p className="mb-7 max-w-[46ch] text-[15.5px] text-ink-muted">
          Agora vamos gerar suas cinco possibilidades a partir do que você respondeu.
        </p>
        {error ? (
          <p className="mb-5 max-w-[46ch] text-[14px] text-role-3">{error}</p>
        ) : null}
        <form action={generateForActiveDiagnostic}>
          <SubmitButton
            pendingText="Gerando suas possibilidades... isso pode levar até 1 minuto, não recarregue a página"
            className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
          >
            Gerar minhas 5 possibilidades →
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
