import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";

export default async function DiarioPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;

  const user = await requireActiveAccess();

  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.userId !== user.id) notFound();

  const entries = await db.journalEntry.findMany({
    where: { planId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-[640px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="DIÁRIO DE EXECUÇÃO" />
      <h1 className="mb-7 font-serif text-2xl font-medium tracking-tight text-petrol">
        Sua linha do tempo
      </h1>

      {entries.length === 0 ? (
        <p className="text-[14.5px] text-ink-muted">
          Nada registrado ainda — o campo de diário aparece a cada check-in semanal.
        </p>
      ) : (
        <div className="flex flex-col gap-4 border-l-2 border-line pl-5">
          {entries.map((entry) => (
            <div key={entry.id} className="relative">
              <span className="absolute top-1.5 -left-[26px] h-2.5 w-2.5 rounded-full bg-gold" />
              <p className="mb-1 font-mono text-[11px] tracking-wide text-ink-muted uppercase">
                {entry.createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
              <p className="text-[14.5px] leading-[1.6] text-ink">{entry.text}</p>
            </div>
          ))}
        </div>
      )}

      <a
        href={`/planos/${planId}`}
        className="mt-8 inline-block text-[14px] font-semibold text-petrol hover:underline"
      >
        ← Voltar para o plano
      </a>
    </div>
  );
}
