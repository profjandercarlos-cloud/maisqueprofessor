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
          <div className="font-serif text-base font-semibold tracking-tight text-petrol">
            Mais Que Professor
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
