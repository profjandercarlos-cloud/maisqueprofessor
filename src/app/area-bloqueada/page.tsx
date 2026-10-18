import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-active-access";
import { montarLinkCompra } from "@/lib/hotmart/checkout";
import { NOME_PLANO_PAGO } from "@/lib/hotmart/oferta";
import { AREAS_TRANCADAS } from "@/lib/acesso-areas";

export default async function AreaBloqueadaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const de = typeof query.de === "string" ? query.de : undefined;
  const origem = de ? AREAS_TRANCADAS[de] : undefined;

  const user = await requireUser();
  const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { name: true, email: true } });
  const linkCompra = montarLinkCompra(dbUser?.email ?? user.email, dbUser?.name);

  return (
    <div className="mx-auto w-full max-w-[600px] flex-1 px-5 pb-20">
      <AppHeader progressLabel={NOME_PLANO_PAGO.toUpperCase()} />

      <span className="mb-[18px] inline-block rounded-full bg-badge-bg px-2.5 py-[5px] font-mono text-[11px] tracking-[0.12em] text-badge-text uppercase">
        Conta gratuita
      </span>
      <h1 className="mb-2 font-serif text-2xl leading-snug font-medium tracking-tight text-petrol">
        {origem
          ? `${origem.titulo} faz parte do ${NOME_PLANO_PAGO}`
          : `Esta área faz parte do ${NOME_PLANO_PAGO}`}
      </h1>
      {origem ? <p className="mb-6 max-w-[55ch] text-[14.5px] text-ink-muted">{origem.descricao}</p> : null}

      <p className="mb-3 text-[14.5px] font-medium text-ink">Com o {NOME_PLANO_PAGO} você libera:</p>
      <ul className="mb-8 flex flex-col gap-2.5">
        {Object.values(AREAS_TRANCADAS).map((a) => (
          <li key={a.titulo} className="rounded-lg border border-line bg-paper-raised px-4 py-3 text-[13.5px]">
            <span className="font-semibold text-petrol">{a.titulo}</span>
            <span className="text-ink-muted"> — {a.descricao}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        {linkCompra ? (
          <a
            href={linkCompra}
            className="rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-paper transition-colors hover:opacity-90"
          >
            Quero o {NOME_PLANO_PAGO} →
          </a>
        ) : null}
        <a href="/negocios" className="text-sm font-semibold text-petrol hover:underline">
          Continuar explorando ideias de negócios
        </a>
      </div>
      {linkCompra ? (
        <p className="mt-3 text-[12.5px] text-ink-muted">
          Use o mesmo e-mail da sua conta ({dbUser?.email ?? user.email}) na compra, para o acesso ser liberado
          aqui automaticamente.
        </p>
      ) : null}
    </div>
  );
}
