import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader({ progressLabel }: { progressLabel?: string }) {
  return (
    <header className="mb-10 flex items-center justify-between border-b border-line py-[22px]">
      <a href="/" className="flex items-center gap-2.5">
        <div className="relative h-7 w-7 shrink-0 rounded-lg bg-petrol">
          <span className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold" />
        </div>
        <div className="font-serif text-base font-semibold tracking-tight text-petrol">
          Mais Que Professor
        </div>
      </a>
      <div className="flex items-center gap-3.5">
        {progressLabel ? (
          <span className="font-mono text-[11px] tracking-wide text-ink-muted">
            {progressLabel}
          </span>
        ) : null}
        <ThemeToggle />
      </div>
    </header>
  );
}
