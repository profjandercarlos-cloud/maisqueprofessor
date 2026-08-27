import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { grantAccessManually, revokeAccessManually, toggleAdmin } from "../../actions";

const fieldLabel = "text-[12.5px] text-ink-muted";
const fieldValue = "text-[15px] text-ink";

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId } = await params;
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      diagnostics: { orderBy: { createdAt: "desc" }, select: { id: true, status: true, intention: true, createdAt: true } },
      plans: { orderBy: { createdAt: "desc" }, include: { possibility: { select: { titulo: true } } } },
      hotmartTransactions: { orderBy: { processedAt: "desc" } },
    },
  });
  if (!user) notFound();

  const returnTo = `/admin/usuarios/${userId}`;
  const isRevoked = Boolean(user.accessRevokedAt);
  const isExpired = user.accessExpiresAt ? user.accessExpiresAt < new Date() : false;

  return (
    <div className="flex flex-col gap-8">
      <a href="/admin/usuarios" className="text-[13px] font-semibold text-petrol hover:underline">
        ← Todos os usuários
      </a>

      {error ? (
        <p className="rounded-lg border border-role-3 bg-paper px-4 py-2.5 text-[13.5px] text-role-3">
          {error}
        </p>
      ) : null}

      <section className="rounded-[var(--radius-app)] border border-line bg-paper-raised p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif text-2xl font-medium tracking-tight text-petrol">{user.name}</h1>
          {user.isAdmin ? (
            <span className="rounded-full bg-gold-soft px-2.5 py-0.5 font-mono text-[10.5px] tracking-wide text-petrol uppercase">
              Administrador
            </span>
          ) : null}
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className={fieldLabel}>E-mail</p>
            <p className={fieldValue}>{user.email}</p>
          </div>
          <div>
            <p className={fieldLabel}>Status</p>
            <p className={fieldValue}>{isRevoked ? "Revogado" : isExpired ? "Expirado" : "Ativo"}</p>
          </div>
          <div>
            <p className={fieldLabel}>Acesso até</p>
            <p className={fieldValue}>
              {user.accessExpiresAt ? formatDate(user.accessExpiresAt) : "—"}
            </p>
          </div>
          <div>
            <p className={fieldLabel}>Cadastro</p>
            <p className={fieldValue}>{formatDate(user.createdAt)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <form action={grantAccessManually.bind(null, returnTo)}>
            <input type="hidden" name="email" value={user.email} />
            <input type="hidden" name="name" value={user.name} />
            <button
              type="submit"
              className="rounded-lg bg-gold px-4 py-2 text-[13.5px] font-semibold text-paper transition-colors hover:bg-gold-soft"
            >
              Conceder / renovar 1 ano
            </button>
          </form>

          {!isRevoked ? (
            <form action={revokeAccessManually.bind(null, returnTo, user.email)}>
              <button
                type="submit"
                className="rounded-lg border border-role-3 px-4 py-2 text-[13.5px] font-semibold text-role-3 transition-colors hover:bg-paper"
              >
                Revogar acesso
              </button>
            </form>
          ) : null}

          <form action={toggleAdmin.bind(null, returnTo, user.id, !user.isAdmin)}>
            <button
              type="submit"
              className="rounded-lg border border-line px-4 py-2 text-[13.5px] font-semibold text-ink transition-colors hover:border-petrol hover:text-petrol"
            >
              {user.isAdmin ? "Remover privilégio de admin" : "Tornar administrador"}
            </button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg font-medium tracking-tight text-petrol">
          Diagnósticos ({user.diagnostics.length})
        </h2>
        {user.diagnostics.length === 0 ? (
          <p className="text-[13.5px] text-ink-muted">Nenhum diagnóstico iniciado.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {user.diagnostics.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-2.5 text-[13.5px]">
                <span className="text-ink">{d.intention} · {d.status}</span>
                <span className="text-ink-muted">{formatDate(d.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg font-medium tracking-tight text-petrol">
          Planos ({user.plans.length})
        </h2>
        {user.plans.length === 0 ? (
          <p className="text-[13.5px] text-ink-muted">Nenhum plano criado.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {user.plans.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-2.5 text-[13.5px]">
                <span className="text-ink">{p.possibility.titulo} · {p.status}</span>
                <span className="text-ink-muted">{formatDate(p.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg font-medium tracking-tight text-petrol">
          Transações Hotmart ({user.hotmartTransactions.length})
        </h2>
        {user.hotmartTransactions.length === 0 ? (
          <p className="text-[13.5px] text-ink-muted">Nenhuma transação vinculada a esta conta.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {user.hotmartTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-2.5 text-[13.5px]">
                <span className="text-ink">{tx.eventType}</span>
                <span className="text-ink-muted">{formatDateTime(tx.processedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
