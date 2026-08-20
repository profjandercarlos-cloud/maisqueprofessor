import { db } from "@/lib/db";
import { grantAccessManually, reprocessTransaction } from "./actions";

const DAY_MS = 24 * 60 * 60 * 1000;

const cardClass = "rounded-[var(--radius-app)] border border-line bg-paper-raised p-4";
const kpiValueClass = "font-serif text-[26px] font-medium leading-none text-petrol";
const kpiLabelClass = "mt-1.5 text-[12.5px] text-ink-muted";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  const now = new Date();
  const in7d = new Date(now.getTime() + 7 * DAY_MS);
  const in30d = new Date(now.getTime() + 30 * DAY_MS);
  const ago7d = new Date(now.getTime() - 7 * DAY_MS);

  const [
    totalUsers,
    activeUsers,
    revokedUsers,
    expiring7,
    expiring30,
    newUsers7d,
    diagnosticsInProgress,
    diagnosticsCompleted,
    plansActive,
    plansPaused,
    lateWeeks,
    approvedNoUser,
    recentTransactions,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { accessRevokedAt: null, OR: [{ accessExpiresAt: null }, { accessExpiresAt: { gt: now } }] } }),
    db.user.count({ where: { accessRevokedAt: { not: null } } }),
    db.user.count({ where: { accessRevokedAt: null, accessExpiresAt: { gte: now, lt: in7d } } }),
    db.user.count({ where: { accessRevokedAt: null, accessExpiresAt: { gte: in7d, lt: in30d } } }),
    db.user.count({ where: { createdAt: { gte: ago7d } } }),
    db.diagnostic.count({ where: { status: "EM_ANDAMENTO" } }),
    db.diagnostic.count({ where: { status: "CONCLUIDO" } }),
    db.plan.count({ where: { status: "ATIVO" } }),
    db.plan.count({ where: { status: "PAUSADO" } }),
    db.planWeek.count({ where: { status: "PENDENTE", scheduledDate: { lt: now }, plan: { status: "ATIVO" } } }),
    db.hotmartTransaction.findMany({
      where: { eventType: { in: ["PURCHASE_APPROVED", "PURCHASE_COMPLETE"] }, userId: null },
      orderBy: { processedAt: "desc" },
      take: 15,
    }),
    db.hotmartTransaction.findMany({
      orderBy: { processedAt: "desc" },
      take: 10,
      include: { user: { select: { email: true } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-10">
      {error ? (
        <p className="rounded-lg border border-role-3 bg-paper px-4 py-2.5 text-[13.5px] text-role-3">
          {error}
        </p>
      ) : null}

      <section>
        <h1 className="mb-4 font-serif text-2xl font-medium tracking-tight text-petrol">
          Visão geral
        </h1>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className={cardClass}>
            <div className={kpiValueClass}>{totalUsers}</div>
            <div className={kpiLabelClass}>Usuários totais</div>
          </div>
          <div className={cardClass}>
            <div className={kpiValueClass}>{activeUsers}</div>
            <div className={kpiLabelClass}>Com acesso ativo</div>
          </div>
          <div className={cardClass}>
            <div className={kpiValueClass}>{revokedUsers}</div>
            <div className={kpiLabelClass}>Revogados</div>
          </div>
          <div className={cardClass}>
            <div className={kpiValueClass}>{expiring7}</div>
            <div className={kpiLabelClass}>Expiram em 7 dias</div>
          </div>
          <div className={cardClass}>
            <div className={kpiValueClass}>{expiring30}</div>
            <div className={kpiLabelClass}>Expiram em 8–30 dias</div>
          </div>
          <div className={cardClass}>
            <div className={kpiValueClass}>{newUsers7d}</div>
            <div className={kpiLabelClass}>Novos usuários (7 dias)</div>
          </div>
          <div className={cardClass}>
            <div className={kpiValueClass}>{diagnosticsInProgress}</div>
            <div className={kpiLabelClass}>Diagnósticos em andamento</div>
          </div>
          <div className={cardClass}>
            <div className={kpiValueClass}>{diagnosticsCompleted}</div>
            <div className={kpiLabelClass}>Diagnósticos concluídos</div>
          </div>
          <div className={cardClass}>
            <div className={kpiValueClass}>{plansActive}</div>
            <div className={kpiLabelClass}>Planos ativos</div>
          </div>
          <div className={cardClass}>
            <div className={kpiValueClass}>{plansPaused}</div>
            <div className={kpiLabelClass}>Planos pausados</div>
          </div>
        </div>
      </section>

      {lateWeeks > 0 ? (
        <section className="rounded-[var(--radius-app)] border border-gold bg-gold-soft p-4">
          <p className="text-[14px] text-ink">
            <strong>{lateWeeks}</strong> semana(s) de plano ativo estão com check-in atrasado
            (passou a data prevista e ninguém respondeu ainda).
          </p>
        </section>
      ) : null}

      {approvedNoUser.length > 0 ? (
        <section>
          <h2 className="mb-1 font-serif text-lg font-medium tracking-tight text-petrol">
            Compras aprovadas sem conta criada
          </h2>
          <p className="mb-3 text-[13.5px] text-ink-muted">
            A Hotmart confirmou o evento, mas algo falhou ao criar a conta — provavelmente vale
            reprocessar ou conceder o acesso manualmente abaixo.
          </p>
          <div className="flex flex-col gap-2">
            {approvedNoUser.map((tx) => {
              const payload = tx.payload as Record<string, unknown>;
              const data = (payload.data ?? {}) as Record<string, unknown>;
              const buyer = (data.buyer ?? {}) as Record<string, unknown>;
              const email = typeof buyer.email === "string" ? buyer.email : "(sem e-mail no payload)";
              return (
                <div
                  key={tx.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-paper px-4 py-3"
                >
                  <div>
                    <p className="text-[14px] font-medium text-ink">{email}</p>
                    <p className="font-mono text-[11px] text-ink-muted">
                      {tx.eventType} · {tx.processedAt.toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <form action={reprocessTransaction.bind(null, "/admin", tx.id)}>
                    <button
                      type="submit"
                      className="rounded-lg border border-petrol px-3.5 py-1.5 text-[13px] font-semibold text-petrol transition-colors hover:bg-gold-soft"
                    >
                      Reprocessar →
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 font-serif text-lg font-medium tracking-tight text-petrol">
          Conceder acesso manualmente
        </h2>
        <form action={grantAccessManually.bind(null, "/admin")} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label htmlFor="email" className="mb-1 block text-[13px] font-medium text-ink">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-line bg-paper px-3.5 py-2 text-[14.5px] text-ink outline-none focus:border-petrol"
            />
          </div>
          <div className="flex-1 min-w-[220px]">
            <label htmlFor="name" className="mb-1 block text-[13px] font-medium text-ink">
              Nome <span className="font-normal text-ink-muted">(só se for criar conta nova)</span>
            </label>
            <input
              id="name"
              name="name"
              className="w-full rounded-lg border border-line bg-paper px-3.5 py-2 text-[14.5px] text-ink outline-none focus:border-petrol"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-petrol px-5 py-2 text-[13.5px] font-semibold text-paper transition-colors hover:bg-petrol-soft"
          >
            Conceder / renovar 1 ano →
          </button>
        </form>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg font-medium tracking-tight text-petrol">
            Últimas transações da Hotmart
          </h2>
          <a href="/admin/hotmart" className="text-[13px] font-semibold text-petrol hover:underline">
            Ver todas →
          </a>
        </div>
        <div className="overflow-x-auto rounded-[var(--radius-app)] border border-line">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line bg-paper-raised text-[11px] text-ink-muted uppercase">
                <th className="px-4 py-2.5 font-mono font-medium">Evento</th>
                <th className="px-4 py-2.5 font-mono font-medium">Usuário vinculado</th>
                <th className="px-4 py-2.5 font-mono font-medium">Quando</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 text-ink">{tx.eventType}</td>
                  <td className="px-4 py-2.5 text-ink-muted">{tx.user?.email ?? "—"}</td>
                  <td className="px-4 py-2.5 text-ink-muted">{tx.processedAt.toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
