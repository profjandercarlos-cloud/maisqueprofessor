import {
  createOwnTask,
  markTaskComplete,
  markTaskPartial,
  pullTaskToCurrentWeek,
  pushTaskToPool,
} from "@/app/planos/[planId]/task-actions";
import { submitCheckin } from "@/app/planos/[planId]/checkin/actions";
import { OBSTACLE_LABELS } from "@/lib/orientacao/biblioteca";
import { formatDate } from "@/lib/format-date";
import type { PlanTask, PlanWeek } from "@/generated/prisma/client";

const ORIGIN_LABEL: Record<string, string> = {
  PLANO: "Do plano",
  PENDENCIA: "Pendência",
  PROPRIA: "Sua",
};

const ORIGIN_COLOR: Record<string, string> = {
  PLANO: "var(--petrol)",
  PENDENCIA: "var(--role-2)",
  PROPRIA: "var(--role-4)",
};

function OriginTag({ origin }: { origin: string }) {
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[9.5px] tracking-wide uppercase"
      style={{ color: ORIGIN_COLOR[origin], background: "var(--paper)" }}
    >
      {ORIGIN_LABEL[origin]}
    </span>
  );
}

function formatWeekRange(start: Date, end: Date) {
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const startLabel = formatDate(start, sameMonth ? { day: "2-digit" } : { day: "2-digit", month: "short" });
  const endLabel = formatDate(end, { day: "2-digit", month: "short" });
  return `${startLabel} a ${endLabel}`;
}

export function PlanMural({
  planId,
  week,
  weekTasks,
  poolTasks,
  nextWeekTasks,
  horasDisponiveis,
  expandedTaskId,
  duracaoSemanas,
}: {
  planId: string;
  week: PlanWeek;
  weekTasks: PlanTask[];
  poolTasks: PlanTask[];
  nextWeekTasks: PlanTask[] | null;
  horasDisponiveis: number;
  expandedTaskId?: string;
  duracaoSemanas: number;
}) {
  const returnTo = "/";
  const horasAlocadas = weekTasks.reduce((sum, t) => sum + t.horasEstimadas, 0);
  const acimaDoOrcamento = horasAlocadas > horasDisponiveis;
  const now = new Date();
  const diasAtraso = Math.floor((now.getTime() - week.scheduledDate.getTime()) / (1000 * 60 * 60 * 24));
  const isExtra = week.weekNumber > duracaoSemanas;

  const weekEnd = new Date(week.scheduledDate);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const pendencias = poolTasks.filter((t) => t.origin !== "PLANO");
  const proximasDoPlano = [...poolTasks.filter((t) => t.origin === "PLANO"), ...(nextWeekTasks ?? [])];
  const adiantouSemanaSeguinte = nextWeekTasks !== null && nextWeekTasks.length === 0;

  return (
    <div className="mb-10 rounded-[var(--radius-app)] border border-petrol bg-paper-raised p-5 shadow-[var(--shadow)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[11px] tracking-wide text-gold uppercase">
          {isExtra ? `Semana ${week.weekNumber} · extra` : `Semana ${week.weekNumber} de ${duracaoSemanas}`}
        </span>
        <span className="text-[12px] text-ink-muted">
          {formatWeekRange(week.scheduledDate, weekEnd)}
          {diasAtraso > 0 ? ` · ${diasAtraso}d atrasada` : ""}
        </span>
      </div>

      <h2 className="mb-4 font-serif text-xl font-medium tracking-tight text-petrol">{week.meta}</h2>

      <ul className="mb-4 flex flex-col gap-2.5">
        {weekTasks.map((task) => {
          const isExpanded = expandedTaskId === task.id;
          return (
            <li key={task.id} className="rounded-lg border border-line bg-paper px-3.5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className="text-[14px] text-ink"
                    style={task.status === "COMPLETO" ? { textDecoration: "line-through", opacity: 0.6 } : undefined}
                  >
                    {task.texto}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-ink-muted">
                    {task.horasEstimadas}h
                    {task.status === "PARCIAL" && task.notaParcial ? ` · faltou: ${task.notaParcial}` : ""}
                  </p>
                </div>
                {task.origin !== "PLANO" ? <OriginTag origin={task.origin} /> : null}
              </div>

              {task.status === "PENDENTE" && !isExpanded ? (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <form action={markTaskComplete.bind(null, returnTo, task.id)}>
                    <button
                      type="submit"
                      className="rounded-full border border-petrol px-3 py-1 text-[12px] font-semibold text-petrol transition-colors hover:bg-gold-soft"
                    >
                      Marcar completo
                    </button>
                  </form>
                  <a
                    href={`/?parcial=${task.id}#tarefa-${task.id}`}
                    className="rounded-full border border-line px-3 py-1 text-[12px] font-semibold text-ink-muted transition-colors hover:border-petrol hover:text-petrol"
                  >
                    Marcar parcial
                  </a>
                  <form action={pushTaskToPool.bind(null, returnTo, task.id)}>
                    <button
                      type="submit"
                      className="rounded-full px-3 py-1 text-[12px] font-medium text-ink-muted hover:text-ink"
                    >
                      Tirar dessa semana
                    </button>
                  </form>
                </div>
              ) : null}

              {task.status === "PENDENTE" && isExpanded ? (
                <form
                  id={`tarefa-${task.id}`}
                  action={markTaskPartial.bind(null, returnTo, task.id)}
                  className="mt-3 flex flex-col gap-2"
                >
                  <textarea
                    name="nota"
                    required
                    placeholder="O que ainda falta fazer aqui?"
                    className="min-h-[60px] w-full resize-y rounded-lg border border-line bg-paper-raised px-3 py-2 text-[13.5px] text-ink outline-none focus:border-petrol"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1.5 text-[12.5px] text-ink-muted">
                      Tempo restante estimado
                      <input
                        type="number"
                        name="horasRestantes"
                        min={0.5}
                        step={0.5}
                        defaultValue={task.horasEstimadas}
                        className="w-16 rounded-md border border-line bg-paper-raised px-2 py-1 text-[13px] text-ink outline-none focus:border-petrol"
                      />
                      h
                    </label>
                    <button
                      type="submit"
                      className="rounded-full bg-petrol px-3.5 py-1.5 text-[12px] font-semibold text-paper hover:bg-petrol-soft"
                    >
                      Confirmar parcial
                    </button>
                    <a href="/" className="text-[12px] font-medium text-ink-muted hover:text-ink">
                      Cancelar
                    </a>
                  </div>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p
        className="mb-1.5 text-[12.5px] font-medium"
        style={{ color: acimaDoOrcamento ? "var(--role-3)" : "var(--ink-muted)" }}
      >
        {horasAlocadas}h alocadas nesta semana de {horasDisponiveis}h disponíveis
        {acimaDoOrcamento ? " — passou do que você tem essa semana" : ""}
      </p>

      {adiantouSemanaSeguinte ? (
        <p className="mb-5 text-[12.5px] font-medium text-petrol">
          Você já puxou todas as tarefas da semana seguinte pra cá — está adiantado(a) no plano.
        </p>
      ) : (
        <div className="mb-5" />
      )}

      <details className="mb-5">
        <summary className="cursor-pointer text-[12.5px] font-semibold text-petrol">
          + Criar tarefa extra
        </summary>
        <form action={createOwnTask.bind(null, returnTo, planId)} className="mt-3 flex flex-wrap items-end gap-2">
          <input
            type="text"
            name="texto"
            required
            placeholder="O que você quer adicionar?"
            className="min-w-[200px] flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-[13.5px] text-ink outline-none focus:border-petrol"
          />
          <label className="flex flex-col gap-1 text-[11px] text-ink-muted">
            Horas
            <input
              type="number"
              name="horas"
              min={0.5}
              step={0.5}
              defaultValue={1}
              className="w-16 rounded-lg border border-line bg-paper px-2 py-2 text-[13.5px] text-ink outline-none focus:border-petrol"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg border border-petrol px-3.5 py-2 text-[13px] font-semibold text-petrol hover:bg-gold-soft"
          >
            Adicionar
          </button>
        </form>
      </details>

      {pendencias.length > 0 ? (
        <div className="mb-5 rounded-lg border border-line bg-paper p-3.5">
          <p className="mb-2.5 text-[12.5px] font-semibold text-ink">Pendências ({pendencias.length})</p>
          <ul className="flex flex-col gap-2.5">
            {pendencias.map((task) => (
              <li key={task.id} className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[13px] text-ink">{task.texto}</span>
                  <span className="flex items-center gap-2">
                    <OriginTag origin={task.origin} />
                    <span className="text-[11.5px] text-ink-muted">{task.horasEstimadas}h</span>
                  </span>
                </div>
                <form action={pullTaskToCurrentWeek.bind(null, returnTo, task.id)}>
                  <button
                    type="submit"
                    className="shrink-0 text-[12px] font-semibold text-petrol hover:underline"
                  >
                    Puxar pra essa semana →
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {proximasDoPlano.length > 0 ? (
        <div className="mb-5 rounded-lg border border-line bg-paper p-3.5">
          <p className="mb-2.5 text-[12.5px] font-semibold text-ink">
            Próximas tarefas do plano ({proximasDoPlano.length})
          </p>
          <ul className="flex max-h-[260px] flex-col gap-2.5 overflow-y-auto pr-1">
            {proximasDoPlano.map((task) => (
              <li key={task.id} className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[13px] text-ink">{task.texto}</span>
                  <span className="text-[11.5px] text-ink-muted">{task.horasEstimadas}h</span>
                </div>
                <form action={pullTaskToCurrentWeek.bind(null, returnTo, task.id)}>
                  <button
                    type="submit"
                    className="shrink-0 text-[12px] font-semibold text-petrol hover:underline"
                  >
                    Puxar pra essa semana →
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <details>
        <summary className="cursor-pointer rounded-lg border border-petrol bg-gold-soft px-4 py-2.5 text-center text-[13.5px] font-semibold text-petrol transition-opacity hover:opacity-90">
          Fechar essa semana →
        </summary>
        <form action={submitCheckin.bind(null, planId)} className="mt-4 flex flex-col gap-5">
          <div>
            <p className="mb-1.5 text-[14px] font-medium text-ink">O que mais pesou nesta semana?</p>
            <div className="flex flex-col gap-2">
              {(Object.keys(OBSTACLE_LABELS) as (keyof typeof OBSTACLE_LABELS)[]).map((key) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[13.5px] text-ink transition-colors has-[:checked]:border-petrol has-[:checked]:bg-gold-soft"
                >
                  <input type="radio" name="obstacleCategory" value={key} required className="mt-0.5 accent-petrol" />
                  <span>{OBSTACLE_LABELS[key]}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="freeText" className="mb-1.5 block text-[14px] font-medium text-ink">
              Quer contar mais sobre o contexto desta semana? <span className="font-normal text-ink-muted">(opcional)</span>
            </label>
            <textarea
              id="freeText"
              name="freeText"
              className="min-h-[64px] w-full resize-y rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-petrol"
            />
          </div>

          <div>
            <label htmlFor="diaryText" className="mb-1.5 block text-[14px] font-medium text-ink">
              Diário desta semana <span className="font-normal text-ink-muted">(opcional — fica registrado na sua linha do tempo)</span>
            </label>
            <textarea
              id="diaryText"
              name="diaryText"
              className="min-h-[64px] w-full resize-y rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-petrol"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-petrol px-6 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-petrol-soft"
          >
            Confirmar check-in →
          </button>
        </form>
      </details>
    </div>
  );
}
