import { AppHeader } from "@/components/app-header";
import { SubmitButton } from "@/components/submit-button";
import { generateForActiveDiagnostic } from "./actions";

export default function DiagnosticoConcluidoPage() {
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
        <form action={generateForActiveDiagnostic}>
          <SubmitButton
            pendingText="Gerando suas possibilidades... isso pode levar até 1 minuto, não recarregue a página"
            className="rounded-lg bg-petrol px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-petrol-soft"
          >
            Gerar minhas 5 possibilidades →
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
