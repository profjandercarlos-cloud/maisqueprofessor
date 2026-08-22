import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { submitAdjustment } from "./actions";

// Ver nota em diagnostico/concluido/page.tsx.
export const maxDuration = 60;

export default async function AjustarConjuntoPage({
  params,
  searchParams,
}: PageProps<"/diagnostico/possibilidades/[roundId]/ajustar">) {
  const { roundId } = await params;
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  const user = await requireActiveAccess();

  const round = await db.generationRound.findUnique({
    where: { id: roundId },
    include: { diagnostic: true },
  });
  if (!round || round.diagnostic.userId !== user.id) notFound();

  const action = submitAdjustment.bind(null, roundId);

  return (
    <div className="mx-auto w-full max-w-[620px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="AJUSTAR CONJUNTO" />
      <h1 className="mb-2 font-serif text-2xl font-medium tracking-tight text-petrol">
        O que não fez sentido nesse conjunto?
      </h1>
      <p className="mb-6 text-[14.5px] text-ink-muted">
        Seja específico — o que você disser aqui molda diretamente as próximas cinco
        possibilidades. Não precisa ser educado demais, só sincero.
      </p>
      <form action={action} className="flex flex-col gap-4">
        <textarea
          name="feedback"
          required
          placeholder="Ex.: nenhuma parecia algo que eu faria de verdade, ou todas ficaram muito perto da sala de aula quando eu queria distância..."
          className="min-h-[160px] w-full resize-y rounded-lg border border-line bg-paper px-3.5 py-3 text-[15px] text-ink outline-none focus:border-petrol"
        />
        {error ? <p className="text-sm text-role-3">{error}</p> : null}
        <div className="flex items-center justify-between gap-4">
          <a
            href={`/diagnostico/possibilidades/${roundId}`}
            className="text-sm font-medium text-ink-muted hover:text-ink"
          >
            ← Voltar
          </a>
          <SubmitButton
            pendingText="Gerando... até 1 minuto, não recarregue"
            className="rounded-lg bg-petrol px-6 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-petrol-soft"
          >
            Gerar novo conjunto →
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
