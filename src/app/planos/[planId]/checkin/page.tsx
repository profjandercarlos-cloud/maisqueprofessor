import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
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

  const user = await requireActiveAccess();

  const plan = await db.plan.findUnique({
    where: { id: planId },
    include: {
      possibility: true,
      weeks: {
        orderBy: { weekNumber: "asc" },
        include: { checkin: true, tasks: { orderBy: { sequencia: "asc" } } },
      },
    },
  });
  if (!plan || plan.userId !== user.id) notFound();

  const currentWeek = plan.weeks.find((w) => w.status === "PENDENTE" && !w.checkin);
  if (!currentWeek) redirect(`/planos/${planId}`);

  const action = submitCheckin.bind(null, planId);
  const STATUS_LABEL: Record<string, string> = {
    COMPLETO: "Completo",
    PARCIAL: "Parcial",
    PENDENTE: "Não iniciado",
  };

  return (
    <div className="mx-auto w-full max-w-[640px] flex-1 px-5 pb-20">
      <AppHeader progressLabel={`CHECK-IN — SEMANA ${currentWeek.weekNumber}`} />

      <h1 className="mb-1.5 font-serif text-2xl font-medium tracking-tight text-petrol">
        Fechar essa semana
      </h1>
      <p className="mb-2 text-[14.5px] text-ink-muted">
        Meta da semana: <strong className="text-ink">{currentWeek.meta}</strong>
      </p>
      <p className="mb-4 text-[13px] text-ink-muted">
        O que ainda estiver marcado como "não iniciado" ou "parcial" continua disponível — parcial
        já virou pendência no seu pool, puxe quando quiser.
      </p>
      <ul className="mb-7 flex flex-col gap-1.5 text-[13.5px] text-ink">
        {currentWeek.tasks.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3">
            <span>{t.texto}</span>
            <span className="shrink-0 font-mono text-[10.5px] tracking-wide text-ink-muted uppercase">
              {STATUS_LABEL[t.status]}
            </span>
          </li>
        ))}
      </ul>

      <form action={action} className="flex flex-col gap-6">
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
