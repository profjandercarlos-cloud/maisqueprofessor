import type { ReactNode } from "react";
import { AppLogoMark } from "@/components/app-logo-mark";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex items-center gap-2.5">
          <AppLogoMark />
          <div className="flex flex-col leading-tight">
            <span className="font-serif text-base font-semibold tracking-tight text-petrol">
              Rota Além da Sala
            </span>
            <span className="text-[10.5px] text-ink-muted">Planejador de transição para professores</span>
            {/* Atribuição à marca-mãe — só aqui (não no header/sidebar, que
                já ficam justos com as 2 linhas existentes), pelo mesmo
                motivo da página de vendas: reforçar a procedência sem
                competir com o nome principal em todo canto. */}
            <span className="mt-0.5 text-[9.5px] text-ink-muted/70">uma solução Mais Que Professor</span>
          </div>
        </div>
        <div className="rounded-[var(--radius-app)] border border-line bg-paper-raised p-7 shadow-[var(--shadow)]">
          <h1 className="mb-1.5 font-serif text-2xl font-medium tracking-tight text-petrol">
            {title}
          </h1>
          {subtitle ? <p className="mb-6 text-sm text-ink-muted">{subtitle}</p> : null}
          {children}
        </div>
      </div>
    </div>
  );
}
