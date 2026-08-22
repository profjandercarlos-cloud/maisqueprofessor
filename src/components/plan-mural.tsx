import {
  createOwnTask,
  markTaskComplete,
  markTaskPartial,
  pullTaskToCurrentWeek,
  pushTaskToPool,
} from "@/app/planos/[planId]/task-actions";
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

export function PlanMural({
  planId,
  week,
  weekTasks,
  poolTasks,
  horasDisponiveis,
  expandedTaskId,
  duracaoSemanas,
}: {
  planId: string;
  week: PlanWeek;
  weekTasks: PlanTask[];
  poolTasks: PlanTask[];
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

  return (
    <div className="mb-10 rounded-[var(--radius-app)] border border-petrol bg-paper-raised p-5 shadow-[var(--shadow)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[11px] tracking-wide text-gold uppercase">
          {isExtra ? `Semana ${week.weekNumber} · extra` : `Semana ${week.weekNumber} de ${duracaoSemanas}`}
        </span>
        <span className="text-[12px] text-ink-muted">
          Prevista pra {formatDate(week.scheduledDate, { day: "2-digit", month: "short" })}
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
                      Adiar pro pool
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
        className="mb-5 text-[12.5px] font-medium"
        style={{ color: acimaDoOrcamento ? "var(--role-3)" : "var(--ink-muted)" }}
      >
        {horasAlocadas}h alocadas nesta semana de {horasDisponiveis}h disponíveis
        {acimaDoOrcamento ? " — passou do que você tem essa semana" : ""}
      </p>

      <details className="mb-5">
        <summary className="cursor-pointer text-[12.5px] font-semibold text-petrol">
          + Adicionar uma tarefa sua
        </summary>
        <form action={createOwnTask.bind(null, returnTo, planId)} className="mt-3 flex flex-wrap items-end gap-2">
          <input
            type="text"
            name="texto"
            required
            placeholder="O que você quer adicionar?"
            className="min-w-[200px] flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-[13.5px] text-ink outline-none focus:border-petrol"
          />
          <input
            type="number"
            name="horas"
            min={0.5}
            step={0.5}
            defaultValue={1}
            className="w-16 rounded-lg border border-line bg-paper px-2 py-2 text-[13.5px] text-ink outline-none focus:border-petrol"
          />
          <button
            type="submit"
            className="rounded-lg border border-petrol px-3.5 py-2 text-[13px] font-semibold text-petrol hover:bg-gold-soft"
          >
            Adicionar
          </button>
        </form>
      </details>

      {poolTasks.length > 0 ? (
        <div className="mb-5 rounded-lg border border-line bg-paper p-3.5">
          <p className="mb-2.5 text-[12.5px] font-semibold text-ink">
            Pendências e tarefas suas ({poolTasks.length})
          </p>
          <ul className="flex flex-col gap-2">
            {poolTasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <OriginTag origin={task.origin} />
                  <span className="truncate text-[13px] text-ink">{task.texto}</span>
                  <span className="shrink-0 text-[11.5px] text-ink-muted">{task.horasEstimadas}h</span>
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

      <a
        href={`/planos/${planId}/checkin`}
        className="block rounded-lg border border-petrol bg-gold-soft px-4 py-2.5 text-center text-[13.5px] font-semibold text-petrol transition-opacity hover:opacity-90"
      >
        Fazer check-in desta semana →
      </a>
    </div>
  );
}
