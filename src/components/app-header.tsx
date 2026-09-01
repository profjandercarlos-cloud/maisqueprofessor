import { ThemeToggle } from "@/components/theme-toggle";
import { AppLogoMark } from "@/components/app-logo-mark";
import { Medal } from "@/components/medal";
import { PapelIcon, PAPEL_LABELS } from "@/components/papel-icon";
import { loadActivePlanBadge } from "@/lib/plano/active-plan-badge";
import { LEVEL_ORDER } from "@/lib/plano/evolucao";

export async function AppHeader({ progressLabel }: { progressLabel?: string }) {
  const badge = await loadActivePlanBadge();

  return (
    <>
      {/* Celular (abaixo de sm) — logo e botão de tema numa linha; badge de
          papel/medalhas e o rótulo da seção em outra, pra não amontoar tudo
          junto como acontecia quando o cabeçalho de telas grandes só
          quebrava linha sem nenhum agrupamento pensado pra isso. */}
      <header className="mb-8 flex flex-col gap-2.5 border-b border-line py-4 sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2.5">
            <AppLogoMark />
            <div className="font-serif text-base font-semibold tracking-tight text-petrol">
              Mais Que Professor
            </div>
          </a>
          <ThemeToggle />
        </div>

        {badge || progressLabel ? (
          <div className="flex items-center justify-between gap-3">
            {badge ? (
              <div className="flex items-center gap-2" title={PAPEL_LABELS[badge.papel]}>
                <PapelIcon papel={badge.papel} className="h-4 w-4 shrink-0 text-petrol" />
                <div className="flex items-center gap-1">
                  {badge.achievedCount === 0 ? (
                    <span className="text-[10px] text-ink-muted">Sem medalhas ainda</span>
                  ) : (
                    LEVEL_ORDER.slice(1, badge.achievedCount + 1).map((level) => (
                      <Medal key={level} level={level} size={14} />
                    ))
                  )}
                </div>
              </div>
            ) : (
              <span />
            )}
            {progressLabel ? (
              <span className="font-mono text-[10.5px] tracking-wide text-ink-muted uppercase">
                {progressLabel}
              </span>
            ) : null}
          </div>
        ) : null}
      </header>

      {/* Tablet/computador (sm e acima). A partir de xl a marca some daqui —
          o cartão fixo da sidebar (AppNavLinks) já mostra o logo lá, e
          duplicar nas duas colunas ficava redundante. */}
      <header className="mb-10 hidden flex-wrap items-center justify-between gap-y-2 border-b border-line py-[22px] sm:flex">
        <div className="flex flex-wrap items-center gap-3">
          <a href="/" className="flex items-center gap-2.5 xl:hidden">
            <AppLogoMark />
            <div className="font-serif text-base font-semibold tracking-tight text-petrol">
              Mais Que Professor
            </div>
          </a>

          {badge ? (
            <div
              className="flex items-center gap-2.5 border-l border-line pl-3 xl:border-l-0 xl:pl-0"
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
    </>
  );
}
