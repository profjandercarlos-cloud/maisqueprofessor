import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { formatDate } from "@/lib/format-date";
import { WEEKDAY_LABELS } from "@/lib/plano/weekdays";
import { AGENDA_COLORS, AGENDA_COLOR_MAP, DEFAULT_AGENDA_COLOR } from "@/lib/agenda/colors";
import {
  GRID_START_MINUTES,
  GRID_END_MINUTES,
  SLOT_MINUTES,
  DEFAULT_SCROLL_MINUTES,
  WEEK_DISPLAY_ORDER,
  getMondayOfWeek,
  addWeeks,
  formatMinutes,
  gridRow,
} from "@/lib/agenda/week";
import {
  createAgendaEntry,
  duplicateAgendaEntryToDay,
  deleteAgendaEntryThisWeek,
  deleteAgendaEntrySeriesFromHere,
  extendAllAgendaSeries,
} from "./actions";

const TIME_LABEL_COL = "56px";
const HEADER_ROW = "34px";
const SLOT_ROW_PX = 20;
const SLOT_ROW = `${SLOT_ROW_PX}px`;
const TOTAL_SLOTS = (GRID_END_MINUTES - GRID_START_MINUTES) / SLOT_MINUTES;
const SCROLL_CONTAINER_MAX_HEIGHT = "560px";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;
  const editingId = typeof query.editar === "string" ? query.editar : undefined;

  const user = await requireActiveAccess();
  const currentMonday = getMondayOfWeek(new Date());
  const weekEnd = addWeeks(currentMonday, 1);
  const prevWeekEnd = new Date(weekEnd);
  prevWeekEnd.setUTCDate(prevWeekEnd.getUTCDate() - 1);

  const weekEntries = await db.agendaEntry.findMany({
    where: { userId: user.id, weekStart: currentMonday },
    orderBy: [{ weekday: "asc" }, { startMinutes: "asc" }],
  });

  const seriesIds = [...new Set(weekEntries.map((e) => e.seriesId))];
  const futureCounts =
    seriesIds.length > 0
      ? await db.agendaEntry.groupBy({
          by: ["seriesId"],
          where: { userId: user.id, seriesId: { in: seriesIds }, weekStart: { gt: currentMonday } },
          _count: { _all: true },
        })
      : [];
  const hasFutureSet = new Set(futureCounts.filter((f) => f._count._all > 0).map((f) => f.seriesId));

  const editingEntry = editingId ? weekEntries.find((e) => e.id === editingId) : undefined;

  const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => GRID_START_MINUTES + i * SLOT_MINUTES);
  const defaultScrollTop = ((DEFAULT_SCROLL_MINUTES - GRID_START_MINUTES) / SLOT_MINUTES) * SLOT_ROW_PX;

  return (
    <div className="mx-auto w-full max-w-[900px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="AGENDA" />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1.5 font-serif text-2xl font-medium tracking-tight text-petrol">Agenda</h1>
          <p className="max-w-[520px] text-[13px] text-ink-muted">
            Sua semana, pra organizar quando você vai executar o plano e o que mais já ocupa seu
            tempo. Não é só do plano — anote qualquer compromisso.
          </p>
        </div>
        <form action={extendAllAgendaSeries}>
          <button
            type="submit"
            className="rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-semibold text-ink-muted transition-colors hover:border-petrol hover:text-petrol"
          >
            Estender repetições por mais 52 semanas
          </button>
        </form>
      </div>

      {error ? <p className="mb-4 text-sm text-role-3">{error}</p> : null}

      <p className="mb-3 text-[12.5px] font-medium text-ink-muted">
        Semana de {formatDate(currentMonday, { day: "2-digit", month: "short" })} a{" "}
        {formatDate(prevWeekEnd, { day: "2-digit", month: "short" })}
      </p>

      <details className="mb-4 rounded-[var(--radius-app)] border border-line bg-paper-raised p-4">
        <summary className="cursor-pointer text-[14px] font-semibold text-petrol">
          + Novo compromisso
        </summary>
        <form action={createAgendaEntry} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              name="label"
              required
              placeholder="O que é esse compromisso?"
              className="min-w-[220px] flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-[13.5px] text-ink outline-none focus:border-petrol"
            />
            <label className="flex flex-col gap-1 text-[11px] text-ink-muted">
              Dia
              <select
                name="weekday"
                defaultValue={1}
                className="rounded-lg border border-line bg-paper px-2 py-2 text-[13.5px] text-ink"
              >
                {WEEK_DISPLAY_ORDER.map((wd) => (
                  <option key={wd} value={wd}>
                    {WEEKDAY_LABELS[wd]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-ink-muted">
              Início
              <input
                type="time"
                name="startTime"
                step={1800}
                defaultValue="07:00"
                required
                className="rounded-lg border border-line bg-paper px-2 py-2 text-[13.5px] text-ink"
              />
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-ink-muted">
              Fim
              <input
                type="time"
                name="endTime"
                step={1800}
                defaultValue="08:00"
                required
                className="rounded-lg border border-line bg-paper px-2 py-2 text-[13.5px] text-ink"
              />
            </label>
          </div>

          <div>
            <p className="mb-1.5 text-[12px] font-medium text-ink-muted">Cor</p>
            <div className="flex flex-wrap gap-2">
              {AGENDA_COLORS.map((c) => (
                <label key={c.token} className="cursor-pointer">
                  <input
                    type="radio"
                    name="color"
                    value={c.token}
                    defaultChecked={c.token === DEFAULT_AGENDA_COLOR}
                    className="peer sr-only"
                  />
                  <span
                    title={c.label}
                    className="block h-6 w-6 rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-paper-raised peer-checked:ring-petrol"
                    style={{ background: c.hex }}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[13px] text-ink">
              <input type="checkbox" name="alsoWeekdays" className="accent-petrol" />
              Replicar pra todos os dias úteis (seg a sex)
            </label>
            <label className="flex items-center gap-2 text-[13px] text-ink">
              <input type="checkbox" name="alsoWeekend" className="accent-petrol" />
              Replicar pro sábado e domingo também
            </label>
            <label className="flex items-center gap-2 text-[13px] text-ink">
              <input type="checkbox" name="repeatWeeks" className="accent-petrol" />
              Repetir nas próximas 52 semanas
            </label>
          </div>

          <button
            type="submit"
            className="self-start rounded-lg bg-petrol px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-petrol-soft"
          >
            Salvar
          </button>
        </form>
      </details>

      <div className="mb-6 overflow-x-auto rounded-[var(--radius-app)] border border-line bg-paper-raised p-3">
        <div
          id="agenda-grid-scroll"
          className="overflow-y-auto"
          style={{ maxHeight: SCROLL_CONTAINER_MAX_HEIGHT }}
        >
        <div
          className="relative grid min-w-[720px]"
          style={{
            gridTemplateColumns: `${TIME_LABEL_COL} repeat(7, 1fr)`,
            gridTemplateRows: `${HEADER_ROW} repeat(${TOTAL_SLOTS}, ${SLOT_ROW})`,
          }}
        >
          {/* cabeçalho — fixo no topo ao rolar (sticky relativo ao container com scroll) */}
          <div
            className="sticky top-0 z-20 bg-paper-raised"
            style={{ gridColumn: 1, gridRow: 1 }}
          />
          {WEEK_DISPLAY_ORDER.map((weekday, i) => (
            <div
              key={weekday}
              className="sticky top-0 z-20 flex items-center justify-center border-b border-line bg-paper-raised text-[11px] font-semibold text-petrol uppercase"
              style={{ gridColumn: i + 2, gridRow: 1 }}
            >
              {WEEKDAY_LABELS[weekday].slice(0, 3)}
            </div>
          ))}

          {/* rótulos de hora */}
          {slots.map((minutes, i) => (
            <div
              key={minutes}
              className="pr-2 text-right font-mono text-[9.5px] text-ink-muted"
              style={{ gridColumn: 1, gridRow: i + 2 }}
            >
              {minutes % 60 === 0 ? formatMinutes(minutes) : ""}
            </div>
          ))}

          {/* linhas de hora cheia (visual) */}
          {slots.map((minutes, i) =>
            minutes % 60 === 0 ? (
              <div
                key={`line-${minutes}`}
                className="border-t border-line/60"
                style={{ gridColumn: "1 / 9", gridRow: i + 2 }}
              />
            ) : null,
          )}

          {/* compromissos */}
          {weekEntries.map((entry) => {
            const colIndex = WEEK_DISPLAY_ORDER.indexOf(entry.weekday) + 2;
            const hex = AGENDA_COLOR_MAP[entry.color] ?? AGENDA_COLOR_MAP[DEFAULT_AGENDA_COLOR];
            return (
              <a
                key={entry.id}
                href={`/agenda?editar=${entry.id}#editar`}
                className="z-10 m-[1px] flex items-center justify-center overflow-hidden rounded-md px-1.5 py-0.5 text-center text-[10.5px] leading-tight font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                style={{
                  gridColumn: colIndex,
                  gridRow: `${gridRow(entry.startMinutes)} / ${gridRow(entry.endMinutes)}`,
                  background: hex,
                }}
              >
                {entry.label}
              </a>
            );
          })}
        </div>
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.getElementById('agenda-grid-scroll').scrollTop = ${defaultScrollTop};`,
        }}
      />

      {editingEntry ? (
        <div id="editar" className="mb-6 rounded-[var(--radius-app)] border border-petrol bg-paper-raised p-4">
          <p className="mb-1 text-[13.5px] font-semibold text-ink">
            {editingEntry.label} · {WEEKDAY_LABELS[editingEntry.weekday]}{" "}
            {formatMinutes(editingEntry.startMinutes)}–{formatMinutes(editingEntry.endMinutes)}
          </p>

          <div className="mb-4 flex flex-wrap gap-2">
            {hasFutureSet.has(editingEntry.seriesId) ? (
              <>
                <form action={deleteAgendaEntryThisWeek.bind(null, editingEntry.id)}>
                  <button
                    type="submit"
                    className="rounded-full border border-line px-3 py-1 text-[12px] font-semibold text-ink-muted hover:border-petrol hover:text-petrol"
                  >
                    Excluir só esta semana
                  </button>
                </form>
                <form action={deleteAgendaEntrySeriesFromHere.bind(null, editingEntry.id)}>
                  <button
                    type="submit"
                    className="rounded-full border border-role-3 px-3 py-1 text-[12px] font-semibold text-role-3"
                  >
                    Excluir esta semana e as seguintes
                  </button>
                </form>
              </>
            ) : (
              <form action={deleteAgendaEntryThisWeek.bind(null, editingEntry.id)}>
                <button
                  type="submit"
                  className="rounded-full border border-role-3 px-3 py-1 text-[12px] font-semibold text-role-3"
                >
                  Excluir
                </button>
              </form>
            )}
            <a
              href="/agenda"
              className="rounded-full px-3 py-1 text-[12px] font-medium text-ink-muted hover:text-ink"
            >
              Cancelar
            </a>
          </div>

          <p className="mb-2 text-[12.5px] font-semibold text-ink">Duplicar pra outro dia</p>
          <form
            action={duplicateAgendaEntryToDay.bind(null, editingEntry.id)}
            className="flex flex-wrap items-end gap-2"
          >
            <label className="flex flex-col gap-1 text-[11px] text-ink-muted">
              Dia
              <select
                name="weekday"
                defaultValue={editingEntry.weekday}
                className="rounded-lg border border-line bg-paper px-2 py-1.5 text-[13px] text-ink"
              >
                {WEEK_DISPLAY_ORDER.map((wd) => (
                  <option key={wd} value={wd}>
                    {WEEKDAY_LABELS[wd]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-ink-muted">
              Início
              <input
                type="time"
                name="startTime"
                step={1800}
                defaultValue={formatMinutes(editingEntry.startMinutes)}
                className="rounded-lg border border-line bg-paper px-2 py-1.5 text-[13px] text-ink"
              />
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-ink-muted">
              Fim
              <input
                type="time"
                name="endTime"
                step={1800}
                defaultValue={formatMinutes(editingEntry.endMinutes)}
                className="rounded-lg border border-line bg-paper px-2 py-1.5 text-[13px] text-ink"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg border border-petrol px-3.5 py-2 text-[13px] font-semibold text-petrol hover:bg-gold-soft"
            >
              Duplicar
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
