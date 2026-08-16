import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { OBSTACLE_LABELS } from "@/lib/orientacao/biblioteca";
import { submitCheckin } from "./actions";

const optionCardClass =
  "flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-paper px-4 py-3 text-[14.5px] text-ink transition-colors has-[:checked]:border-petrol has-[:checked]:bg-gold-soft";

const fieldLabel = "mb-1.5 block text-[15px] font-medium text-ink";
const textareaClass =
  "w-full resize-y rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-petrol";

export default async function CheckinPage({
  params,
  searchParams,
}: {
  params: Promise<{ planId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { planId } = await params;
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const plan = await db.plan.findUnique({
    where: { id: planId },
    include: {
      possibility: true,
      weeks: { orderBy: { weekNumber: "asc" }, include: { checkin: true } },
    },
  });
  if (!plan || plan.userId !== user.id) notFound();

  const currentWeek = plan.weeks.find((w) => w.status === "PENDENTE" && !w.checkin);
  if (!currentWeek) redirect(`/planos/${planId}`);

  const tasks = currentWeek.tasks as unknown as { tarefas: string[] };
  const action = submitCheckin.bind(null, planId);

  return (
    <div className="mx-auto w-full max-w-[640px] flex-1 px-5 pb-20">
      <AppHeader progressLabel={`CHECK-IN — SEMANA ${currentWeek.weekNumber}`} />

      <h1 className="mb-1.5 font-serif text-2xl font-medium tracking-tight text-petrol">
        Como foi essa semana?
      </h1>
      <p className="mb-2 text-[14.5px] text-ink-muted">
        Meta da semana: <strong className="text-ink">{currentWeek.meta}</strong>
      </p>
      <ul className="mb-7 list-inside list-disc text-[13.5px] text-ink-muted">
        {tasks.tarefas.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>

      <form action={action} className="flex flex-col gap-6">
        <div>
          <label htmlFor="doneItems" className={fieldLabel}>
            O que foi feito
          </label>
          <textarea id="doneItems" name="doneItems" required className={`${textareaClass} min-h-[80px]`} />
        </div>

        <div>
          <label htmlFor="notDoneItems" className={fieldLabel}>
            O que não foi feito
          </label>
          <textarea
            id="notDoneItems"
            name="notDoneItems"
            required
            placeholder='Pode escrever "nada" se você cumpriu tudo.'
            className={`${textareaClass} min-h-[80px]`}
          />
        </div>

        <div>
          <p className={fieldLabel}>O que mais pesou nesta semana?</p>
          <div className="flex flex-col gap-2">
            {(Object.keys(OBSTACLE_LABELS) as (keyof typeof OBSTACLE_LABELS)[]).map((key) => (
              <label key={key} className={optionCardClass}>
                <input type="radio" name="obstacleCategory" value={key} required className="mt-0.5 accent-petrol" />
                <span>{OBSTACLE_LABELS[key]}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="freeText" className={fieldLabel}>
            Quer contar mais sobre o contexto desta semana? <span className="font-normal text-ink-muted">(opcional)</span>
          </label>
          <textarea id="freeText" name="freeText" className={`${textareaClass} min-h-[70px]`} />
        </div>

        <div>
          <label htmlFor="diaryText" className={fieldLabel}>
            Diário desta semana <span className="font-normal text-ink-muted">(opcional — fica registrado na sua linha do tempo)</span>
          </label>
          <textarea id="diaryText" name="diaryText" className={`${textareaClass} min-h-[70px]`} />
        </div>

        {error ? <p className="text-sm text-role-3">{error}</p> : null}

        <button
          type="submit"
          className="rounded-lg bg-petrol px-6 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-petrol-soft"
        >
          Confirmar check-in →
        </button>
      </form>
    </div>
  );
}
