import { markMilestoneAchieved, unmarkMilestoneAchieved } from "@/app/planos/[planId]/milestones-actions";
import { computeLevel, computeTaskCompletionPercent, LEVEL_LABELS, LEVEL_COLORS } from "@/lib/plano/evolucao";
import { Medal } from "@/components/medal";
import type { PlanMilestone, PlanTask } from "@/generated/prisma/client";

export function PlanEvolucao({
  tasks,
  milestones,
  returnTo,
}: {
  tasks: Pick<PlanTask, "status">[];
  milestones: PlanMilestone[];
  returnTo: string;
}) {
  const percent = computeTaskCompletionPercent(tasks);
  const achievedCount = milestones.filter((m) => m.achievedAt).length;
  const level = computeLevel(achievedCount, milestones.length);

  return (
    <div className="mb-10 rounded-[var(--radius-app)] border border-line bg-paper-raised p-5 shadow-[var(--shadow)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-[11px] tracking-wide text-gold uppercase">Evolução</span>
        {milestones.length > 0 ? (
          <div className="flex items-center gap-2.5">
            <Medal level={level} />
            <span
              className="font-mono text-[12px] font-semibold tracking-wide uppercase"
              style={{ color: LEVEL_COLORS[level] }}
            >
              Nível {LEVEL_LABELS[level]}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mb-5">
        <div className="mb-1.5 flex items-center justify-between text-[12.5px] text-ink-muted">
          <span>Tarefas concluídas</span>
          <span className="font-semibold text-ink">{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-paper">
          <div
            className="h-full rounded-full bg-petrol transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {milestones.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {milestones.map((milestone) => {
            const achieved = !!milestone.achievedAt;
            return (
              <li
                key={milestone.id}
                className="flex items-start gap-3 rounded-lg border border-line bg-paper px-3.5 py-3"
                style={achieved ? { opacity: 0.75 } : undefined}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{
                    background: achieved ? "var(--petrol)" : "var(--paper-raised)",
                    color: achieved ? "var(--paper)" : "var(--ink-muted)",
                    border: achieved ? "none" : "1.5px solid var(--line)",
                  }}
                >
                  {achieved ? "✓" : ""}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[13.5px] font-semibold text-ink"
                    style={achieved ? { textDecoration: "line-through" } : undefined}
                  >
                    {milestone.titulo}
                    {milestone.tipo === "SINAL_EXTERNO" ? (
                      <span
                        className="ml-2 align-middle font-mono text-[9.5px] font-normal tracking-wide text-ink-muted uppercase"
                        title="Depende de resposta de terceiros — não alcançar não significa execução ruim"
                      >
                        depende de resposta externa
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-muted">{milestone.descricao}</p>
                </div>
                <form
                  action={(achieved ? unmarkMilestoneAchieved : markMilestoneAchieved).bind(
                    null,
                    returnTo,
                    milestone.id,
                  )}
                  className="shrink-0"
                >
                  <button
                    type="submit"
                    className="rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-ink-muted transition-colors hover:border-petrol hover:text-petrol"
                  >
                    {achieved ? "Desmarcar" : "Alcancei"}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
