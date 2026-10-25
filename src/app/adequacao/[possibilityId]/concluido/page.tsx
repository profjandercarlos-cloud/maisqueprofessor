import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { getOrCreateAdequacaoResponse } from "@/lib/adequacao/get-active-response";
import { getResumeSlug } from "@/lib/adequacao/steps";
import { cotaDePlanos } from "@/lib/planos/cota";
import { generatePlan } from "./actions";

// Gerar o plano chama a IA e leva bem mais que os 10s padrão da Vercel.
// 300s é o teto do plano Vercel Pro.
export const maxDuration = 300;

export default async function AdequacaoConcluidoPage({
  params,
  searchParams,
}: PageProps<"/adequacao/[possibilityId]/concluido">) {
  const { possibilityId } = await params;
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  const user = await requireActiveAccess();

  const possibility = await db.possibility.findUnique({
    where: { id: possibilityId },
    include: { round: { include: { diagnostic: true } }, plan: true },
  });
  if (!possibility || possibility.round.diagnostic.userId !== user.id) notFound();
  if (possibility.plan) redirect(`/planos/${possibility.plan.id}`);

  const response = await getOrCreateAdequacaoResponse(possibilityId);
  const resumeSlug = getResumeSlug(response.answers as Record<string, unknown>);
  if (resumeSlug !== "concluido") {
    redirect(`/adequacao/${possibilityId}/${resumeSlug}`);
  }

  const cota = cotaDePlanos(await db.plan.count({ where: { userId: user.id } }));
  const action = generatePlan.bind(null, possibilityId);

  return (
    <div className="mx-auto w-full max-w-[680px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="CRIAR PLANO DE EXECUÇÃO" />

      <span className="mb-[18px] inline-block rounded-full bg-badge-bg px-2.5 py-[5px] font-mono text-[11px] tracking-[0.12em] text-badge-text uppercase">
        Tudo certo
      </span>
      <h1 className="mb-2 font-serif text-2xl leading-snug font-medium tracking-tight text-petrol md:text-[27px]">
        {possibility.titulo}
      </h1>
      <p className="mb-8 max-w-[55ch] text-[14.5px] text-ink-muted">
        Com as suas respostas, vamos montar o seu plano de execução: as ações essenciais, na ordem certa, para você
        colocar o primeiro serviço deste negócio no mercado. Cada ação traz um checklist e as orientações para
        executá-la, no seu ritmo.
      </p>

      <form action={action}>
        {error ? <p className="mb-4 text-sm text-role-3">{error}</p> : null}
        <SubmitButton
          disabled={cota.esgotada}
          pendingText="Montando seu plano... isso pode levar até 1 minuto, não recarregue a página"
          className="rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-paper transition-colors hover:opacity-90"
        >
          Criar meu plano de execução →
        </SubmitButton>
        <p className="mt-3 text-[12.5px] text-ink-muted">
          {cota.esgotada
            ? "Você já usou os 5 planos de execução."
            : `Este plano usa 1 dos seus ${cota.limite} planos (${cota.usados} de ${cota.limite} usados).`}
        </p>
      </form>
    </div>
  );
}
