import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-active-access";
import { formatDate } from "@/lib/format-date";
import { WEEKDAY_LABELS } from "@/lib/plano/weekdays";
import { updateSettings } from "./actions";
import { DeleteAccountForm } from "./delete-account-form";

const fieldLabel = "mb-1.5 block text-[15px] font-medium text-ink";
const inputClass =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-petrol";

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;
  const deleteError = typeof query.deleteError === "string" ? query.deleteError : undefined;
  const saved = query.saved === "1";

  const user = await requireUser();

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser) redirect("/login");

  const accessStatus = dbUser.accessRevokedAt
    ? "revogado"
    : dbUser.accessExpiresAt && dbUser.accessExpiresAt < new Date()
      ? "expirado"
      : "ativo";

  return (
    <div className="mx-auto w-full max-w-[600px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="CONFIGURAÇÕES" />
      <h1 className="mb-7 font-serif text-2xl font-medium tracking-tight text-petrol">
        Configurações
      </h1>

      {saved ? (
        <p className="mb-6 rounded-lg border border-line bg-gold-soft px-4 py-2.5 text-[13.5px] text-ink">
          Configurações salvas.
        </p>
      ) : null}

      <form action={updateSettings} className="mb-10 flex flex-col gap-6">
        <div>
          <label htmlFor="name" className={fieldLabel}>
            Nome
          </label>
          <input id="name" name="name" defaultValue={dbUser.name} required className={inputClass} />
        </div>

        <div>
          <p className={fieldLabel}>E-mail</p>
          <p className="text-[14.5px] text-ink-muted">{dbUser.email}</p>
        </div>

        <div>
          <label htmlFor="checkinWeekday" className={fieldLabel}>
            Dia da semana do check-in
          </label>
          <select
            id="checkinWeekday"
            name="checkinWeekday"
            defaultValue={dbUser.checkinWeekday ?? ""}
            required
            className={inputClass}
          >
            <option value="" disabled>
              Selecione um dia
            </option>
            {WEEKDAY_LABELS.map((label, index) => (
              <option key={label} value={index}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className={fieldLabel}>Canal de notificação</p>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[14.5px] text-ink">
              <input type="checkbox" name="notifyEmail" defaultChecked={dbUser.notifyEmail} className="accent-petrol" />
              E-mail
            </label>
            <label className="flex items-center gap-2 text-[14.5px] text-ink">
              <input type="checkbox" name="notifyPush" defaultChecked={dbUser.notifyPush} className="accent-petrol" />
              Notificação push
            </label>
          </div>
          <p className="mt-1 text-[12.5px] text-ink-muted">Pelo menos um precisa ficar ativo.</p>
        </div>

        {error ? <p className="text-sm text-role-3">{error}</p> : null}

        <button
          type="submit"
          className="self-start rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-gold-soft"
        >
          Salvar
        </button>
      </form>

      <div className="mb-10 rounded-[var(--radius-app)] border border-line bg-paper-raised p-5">
        <p className={fieldLabel}>Status de acesso</p>
        <p className="text-[14.5px] text-ink">
          {accessStatus === "ativo" && dbUser.accessExpiresAt
            ? `Ativo até ${formatDate(dbUser.accessExpiresAt)}`
            : accessStatus === "expirado"
              ? "Seu acesso expirou. Renove sua compra para continuar."
              : "Seu acesso foi revogado."}
        </p>
      </div>

      <div className="mb-10 rounded-[var(--radius-app)] border border-line bg-paper-raised p-5">
        <p className={fieldLabel}>Seus dados</p>
        <p className="mb-3 text-[13px] text-ink-muted">
          Pela LGPD, você pode pedir uma cópia de tudo que guardamos sobre você. Este botão gera um
          PDF com seu diagnóstico, as possibilidades geradas, o relatório e o plano de execução,
          incluindo o progresso semana a semana e os check-ins registrados.
        </p>
        <a
          href="/api/conta/exportar"
          className="text-[13.5px] font-semibold text-petrol hover:underline"
        >
          Exportar meus dados (PDF) →
        </a>
      </div>

      <div className="rounded-[var(--radius-app)] border border-line bg-paper-raised p-5">
        <p className={fieldLabel}>Zona de risco</p>
        <DeleteAccountForm email={dbUser.email} error={deleteError} />
      </div>
    </div>
  );
}
