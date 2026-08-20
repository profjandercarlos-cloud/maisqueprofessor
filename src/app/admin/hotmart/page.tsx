import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format-date";
import { reprocessTransaction } from "../actions";

export default async function AdminHotmartPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;
  const onlyUnlinked = query.semUsuario === "1";

  const transactions = await db.hotmartTransaction.findMany({
    where: onlyUnlinked ? { userId: null } : undefined,
    orderBy: { processedAt: "desc" },
    take: 100,
    include: { user: { select: { email: true } } },
  });

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-medium tracking-tight text-petrol">
        Transações da Hotmart
      </h1>
      <p className="mb-5 text-[14.5px] text-ink-muted">
        Últimas 100 · cada linha é um evento recebido pelo webhook (uma compra gera vários, um por
        etapa do ciclo de vida).
      </p>

      {error ? (
        <p className="mb-5 rounded-lg border border-role-3 bg-paper px-4 py-2.5 text-[13.5px] text-role-3">
          {error}
        </p>
      ) : null}

      <div className="mb-5 flex gap-2">
        <a
          href="/admin/hotmart"
          className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium ${!onlyUnlinked ? "border-petrol text-petrol" : "border-line text-ink"}`}
        >
          Todas
        </a>
        <a
          href="/admin/hotmart?semUsuario=1"
          className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium ${onlyUnlinked ? "border-petrol text-petrol" : "border-line text-ink"}`}
        >
          Sem usuário vinculado
        </a>
      </div>

      <div className="flex flex-col gap-2.5">
        {transactions.map((tx) => {
          const payload = tx.payload as Record<string, unknown>;
          const data = (payload.data ?? {}) as Record<string, unknown>;
          const buyer = (data.buyer ?? {}) as Record<string, unknown>;
          const buyerEmail = typeof buyer.email === "string" ? buyer.email : undefined;

          return (
            <details key={tx.id} className="rounded-[var(--radius-app)] border border-line bg-paper-raised">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3 text-[13.5px]">
                <span className="font-medium text-ink">{tx.eventType}</span>
                <span className="text-ink-muted">{buyerEmail ?? "sem e-mail no payload"}</span>
                <span className="text-ink-muted">
                  {tx.user ? `→ ${tx.user.email}` : "sem usuário vinculado"}
                </span>
                <span className="font-mono text-[11px] text-ink-muted">
                  {formatDateTime(tx.processedAt)}
                </span>
              </summary>
              <div className="border-t border-line px-4 py-3">
                <pre className="mb-3 max-h-64 overflow-auto rounded-lg bg-paper p-3 text-[11.5px] text-ink-muted">
                  {JSON.stringify(payload, null, 2)}
                </pre>
                <form action={reprocessTransaction.bind(null, "/admin/hotmart", tx.id)}>
                  <button
                    type="submit"
                    className="rounded-lg border border-petrol px-3.5 py-1.5 text-[13px] font-semibold text-petrol transition-colors hover:bg-gold-soft"
                  >
                    Reprocessar este evento →
                  </button>
                </form>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
