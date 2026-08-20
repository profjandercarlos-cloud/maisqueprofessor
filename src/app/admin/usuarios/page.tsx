import { db } from "@/lib/db";

function statusOf(user: { accessRevokedAt: Date | null; accessExpiresAt: Date | null }) {
  if (user.accessRevokedAt) return { label: "Revogado", tone: "revoked" as const };
  if (user.accessExpiresAt && user.accessExpiresAt < new Date()) {
    return { label: "Expirado", tone: "revoked" as const };
  }
  return { label: "Ativo", tone: "active" as const };
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q.trim() : "";

  const users = await db.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-medium tracking-tight text-petrol">
        Usuários
      </h1>
      <p className="mb-5 text-[14.5px] text-ink-muted">
        {q ? `Resultados para "${q}"` : "Últimos 100 cadastrados"} — {users.length} encontrado(s).
      </p>

      <form action="/admin/usuarios" className="mb-6 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou e-mail…"
          className="w-full max-w-[360px] rounded-lg border border-line bg-paper px-3.5 py-2 text-[14.5px] text-ink outline-none focus:border-petrol"
        />
        <button
          type="submit"
          className="rounded-lg border border-petrol px-4 py-2 text-[13.5px] font-semibold text-petrol transition-colors hover:bg-gold-soft"
        >
          Buscar
        </button>
      </form>

      <div className="overflow-x-auto rounded-[var(--radius-app)] border border-line">
        <table className="w-full text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-line bg-paper-raised text-[11px] text-ink-muted uppercase">
              <th className="px-4 py-2.5 font-mono font-medium">Nome</th>
              <th className="px-4 py-2.5 font-mono font-medium">E-mail</th>
              <th className="px-4 py-2.5 font-mono font-medium">Status</th>
              <th className="px-4 py-2.5 font-mono font-medium">Acesso até</th>
              <th className="px-4 py-2.5 font-mono font-medium">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const status = statusOf(user);
              return (
                <tr key={user.id} className="border-b border-line last:border-0 hover:bg-paper-raised">
                  <td className="px-4 py-2.5">
                    <a href={`/admin/usuarios/${user.id}`} className="font-medium text-petrol hover:underline">
                      {user.name}
                    </a>
                    {user.isAdmin ? (
                      <span className="ml-2 rounded-full bg-gold-soft px-2 py-0.5 font-mono text-[10px] tracking-wide text-petrol uppercase">
                        Admin
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">{user.email}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className="rounded-full px-2.5 py-0.5 font-mono text-[10.5px] tracking-wide uppercase"
                      style={{
                        color: status.tone === "active" ? "var(--petrol)" : "var(--role-3)",
                        background: status.tone === "active" ? "var(--gold-soft)" : "var(--line)",
                      }}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">
                    {user.accessExpiresAt ? user.accessExpiresAt.toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">
                    {user.createdAt.toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
