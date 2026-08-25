import { ThemeToggle } from "@/components/theme-toggle";
import { Medal } from "@/components/medal";
import { PapelIcon, PAPEL_LABELS } from "@/components/papel-icon";
import { loadActivePlanBadge } from "@/lib/plano/active-plan-badge";
import { LEVEL_ORDER } from "@/lib/plano/evolucao";

export async function AppHeader({ progressLabel }: { progressLabel?: string }) {
  const badge = await loadActivePlanBadge();

  return (
    <header className="mb-10 flex flex-wrap items-center justify-between gap-y-2 border-b border-line py-[22px]">
      <div className="flex flex-wrap items-center gap-3">
        <a href="/" className="flex items-center gap-2.5">
          <div className="relative h-7 w-7 shrink-0 rounded-lg bg-petrol">
            <span className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold" />
          </div>
          <div className="font-serif text-base font-semibold tracking-tight text-petrol">
            Mais Que Professor
          </div>
        </a>

        {badge ? (
          <div
            className="flex items-center gap-2.5 border-l border-line pl-3"
            title={PAPEL_LABELS[badge.papel]}
          >
            <PapelIcon papel={badge.papel} className="h-[17px] w-[17px] shrink-0 text-petrol" />
            <span className="h-4 w-px bg-line" />
            <div className="flex items-center gap-1">
              {badge.achievedCount === 0 ? (
                <span className="text-[10.5px] text-ink-muted">Sem medalhas ainda</span>
              ) : (
                LEVEL_ORDER.slice(1, badge.achievedCount + 1).map((level) => (
                  <Medal key={level} level={level} size={15} />
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>

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
