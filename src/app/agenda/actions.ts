"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { AGENDA_COLORS } from "@/lib/agenda/colors";
import { getMondayOfWeek, addWeeks, timeInputValueToMinutes, WEEKS_PER_EXTENSION } from "@/lib/agenda/week";

const VALID_COLORS = new Set(AGENDA_COLORS.map((c) => c.token));

function fail(message: string): never {
  redirect(`/agenda?error=${encodeURIComponent(message)}`);
}

async function loadOwnedEntry(entryId: string, userId: string) {
  const entry = await db.agendaEntry.findUnique({ where: { id: entryId } });
  if (!entry || entry.userId !== userId) return null;
  return entry;
}

export async function createAgendaEntry(formData: FormData) {
  const user = await requireActiveAccess();

  const label = String(formData.get("label") ?? "").trim();
  const color = String(formData.get("color") ?? "");
  const weekday = Number(formData.get("weekday"));
  const startMinutes = timeInputValueToMinutes(String(formData.get("startTime") ?? ""));
  const endMinutes = timeInputValueToMinutes(String(formData.get("endTime") ?? ""));
  const alsoWeekdays = formData.get("alsoWeekdays") === "on";
  const alsoWeekend = formData.get("alsoWeekend") === "on";
  const repeatWeeks = formData.get("repeatWeeks") === "on";

  if (!label) fail("Descreva o que é esse compromisso.");
  if (!VALID_COLORS.has(color)) fail("Escolha uma cor.");
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) fail("Dia da semana inválido.");
  if (startMinutes === null || endMinutes === null) fail("Horário inválido.");
  if (startMinutes >= endMinutes) fail("O horário final precisa ser depois do inicial.");

  const weekdaySet = new Set<number>([weekday]);
  if (alsoWeekdays) [1, 2, 3, 4, 5].forEach((d) => weekdaySet.add(d));
  if (alsoWeekend) [0, 6].forEach((d) => weekdaySet.add(d));

  const currentMonday = getMondayOfWeek(new Date());
  const weekCount = repeatWeeks ? WEEKS_PER_EXTENSION : 1;
  const seriesId = randomUUID();

  const rows: {
    userId: string;
    seriesId: string;
    label: string;
    color: string;
    weekday: number;
    startMinutes: number;
    endMinutes: number;
    weekStart: Date;
  }[] = [];

  for (let w = 0; w < weekCount; w++) {
    const weekStart = addWeeks(currentMonday, w);
    for (const wd of weekdaySet) {
      rows.push({ userId: user.id, seriesId, label, color, weekday: wd, startMinutes, endMinutes, weekStart });
    }
  }

  await db.agendaEntry.createMany({ data: rows });

  revalidatePath("/agenda");
  redirect("/agenda");
}

export async function duplicateAgendaEntryToDay(entryId: string, formData: FormData) {
  const user = await requireActiveAccess();
  const entry = await loadOwnedEntry(entryId, user.id);
  if (!entry) fail("Compromisso não encontrado.");

  const weekday = Number(formData.get("weekday"));
  const startMinutes = timeInputValueToMinutes(String(formData.get("startTime") ?? ""));
  const endMinutes = timeInputValueToMinutes(String(formData.get("endTime") ?? ""));

  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) fail("Dia da semana inválido.");
  if (startMinutes === null || endMinutes === null) fail("Horário inválido.");
  if (startMinutes >= endMinutes) fail("O horário final precisa ser depois do inicial.");

  await db.agendaEntry.create({
    data: {
      userId: user.id,
      seriesId: randomUUID(),
      label: entry.label,
      color: entry.color,
      weekday,
      startMinutes,
      endMinutes,
      weekStart: entry.weekStart,
    },
  });

  revalidatePath("/agenda");
  redirect("/agenda");
}

export async function deleteAgendaEntryThisWeek(entryId: string) {
  const user = await requireActiveAccess();
  const entry = await loadOwnedEntry(entryId, user.id);
  if (!entry) fail("Compromisso não encontrado.");

  await db.agendaEntry.delete({ where: { id: entryId } });

  revalidatePath("/agenda");
  redirect("/agenda");
}

export async function deleteAgendaEntrySeriesFromHere(entryId: string) {
  const user = await requireActiveAccess();
  const entry = await loadOwnedEntry(entryId, user.id);
  if (!entry) fail("Compromisso não encontrado.");

  await db.agendaEntry.deleteMany({
    where: { userId: user.id, seriesId: entry.seriesId, weekStart: { gte: entry.weekStart } },
  });

  revalidatePath("/agenda");
  redirect("/agenda");
}

// Estende toda série ainda em uso (com pelo menos um compromisso já
// registrado) por mais WEEKS_PER_EXTENSION semanas a partir de onde ela
// parou — idempotente, pode clicar quantas vezes quiser sem duplicar nada.
export async function extendAllAgendaSeries() {
  const user = await requireActiveAccess();

  const entries = await db.agendaEntry.findMany({
    where: { userId: user.id },
    orderBy: { weekStart: "asc" },
  });

  type SeriesTemplate = {
    weekdays: Set<number>;
    maxWeekStart: Date;
    label: string;
    color: string;
    startMinutes: number;
    endMinutes: number;
  };
  const series = new Map<string, SeriesTemplate>();

  for (const e of entries) {
    const existing = series.get(e.seriesId);
    if (!existing) {
      series.set(e.seriesId, {
        weekdays: new Set([e.weekday]),
        maxWeekStart: e.weekStart,
        label: e.label,
        color: e.color,
        startMinutes: e.startMinutes,
        endMinutes: e.endMinutes,
      });
    } else {
      existing.weekdays.add(e.weekday);
      if (e.weekStart > existing.maxWeekStart) existing.maxWeekStart = e.weekStart;
    }
  }

  const currentMonday = getMondayOfWeek(new Date());
  const targetLimit = addWeeks(currentMonday, WEEKS_PER_EXTENSION - 1);

  const rows: {
    userId: string;
    seriesId: string;
    label: string;
    color: string;
    weekday: number;
    startMinutes: number;
    endMinutes: number;
    weekStart: Date;
  }[] = [];

  for (const [seriesId, s] of series) {
    let cursor = addWeeks(s.maxWeekStart, 1);
    while (cursor <= targetLimit) {
      for (const weekday of s.weekdays) {
        rows.push({
          userId: user.id,
          seriesId,
          label: s.label,
          color: s.color,
          weekday,
          startMinutes: s.startMinutes,
          endMinutes: s.endMinutes,
          weekStart: cursor,
        });
      }
      cursor = addWeeks(cursor, 1);
    }
  }

  if (rows.length > 0) {
    await db.agendaEntry.createMany({ data: rows, skipDuplicates: true });
  }

  revalidatePath("/agenda");
  redirect("/agenda");
}
