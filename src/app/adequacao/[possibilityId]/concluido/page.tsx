import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { getOrCreateAdequacaoResponse } from "@/lib/adequacao/get-active-response";
import { getResumeSlug } from "@/lib/adequacao/steps";
import { generatePlan } from "./actions";

// Ver nota em diagnostico/concluido/page.tsx — sem isto a Vercel mata a
// função aos 10s, e gerar o Plano Personalizado de Transição leva bem mais que isso.
// 300s — teto do plano Vercel Pro (era 120, ajustado pro Hobby).
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

  // Se as ações de especificação já existem mas ainda faltam respostas (ou
  // o feedback geral), manda direto pra lá em vez de esperar o clique em
  // "Continuar minha rota" pra só então perceber isso — quem sai da tela
  // de Sua Rota Específica e volta por aqui depois não devia precisar de
  // um clique a mais só pra ser redirecionado de novo. Não gera nada aqui
  // (isso só acontece no clique, na 1ª vez) — é só leitura do que já existe.
  const acoesExistentes = await db.acaoEspecificacao.findMany({ where: { possibilityId } });
  const acoesIncompletas = acoesExistentes.some((a) => a.respondidoEm === null);
  if (acoesExistentes.length > 0) {
    if (acoesIncompletas || !possibility.feedbackEspecificacao) {
      redirect(`/adequacao/${possibilityId}/especificacao`);
    }
  }

  // Vontade de continuar caiu depois da Etapa de Especificação — em vez de
  // insistir na mesma possibilidade sem um recorte que sustente um plano,
  // recomenda tentar outra das 5 possibilidades ainda disponíveis.
  const feedback = possibility.feedbackEspecificacao as { vontadeContinuar?: string } | null;
  const semRecorteViavel = acoesExistentes.length > 0 && !acoesIncompletas && feedback?.vontadeContinuar === "diminuiu";

  const action = generatePlan.bind(null, possibilityId);

  return (
    <div className="mx-auto w-full max-w-[680px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="SEU PLANO JÁ PODE SER CALIBRADO" />

      <span className="mb-[18px] inline-block rounded-full bg-badge-bg px-2.5 py-[5px] font-mono text-[11px] tracking-[0.12em] text-badge-text uppercase">
        Possibilidade aprovada
      </span>
      <h1 className="mb-2 font-serif text-2xl leading-snug font-medium tracking-tight text-petrol md:text-[27px]">
        {possibility.titulo}
      </h1>

      {semRecorteViavel ? (
        <>
          <p className="mb-8 max-w-[55ch] text-[14.5px] text-ink-muted">
            Depois de Sua Rota Específica, sua vontade de continuar com esta possibilidade caiu. Em vez de forçar
            um plano em cima de um recorte que não convenceu, vale mais a pena testar outra das suas 5
            possibilidades.
          </p>
          <a
            href={`/diagnostico/possibilidades/${possibility.roundId}`}
            className="inline-block rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-paper transition-colors hover:opacity-90"
          >
            Ver minhas outras possibilidades →
          </a>
        </>
      ) : (
        <>
          <p className="mb-8 max-w-[55ch] text-[14.5px] text-ink-muted">
            Antes do seu Plano Personalizado de Transição, você vai passar por Sua Rota Específica — ações
            rápidas e reais que confirmam quem é seu público, qual problema específico atacar e como o contato
            acontece, antes do plano existir. A duração e a profundidade se ajustam a você, produzindo
            evidências reais sem ultrapassar sua disponibilidade.
          </p>

          <form action={action}>
            {error ? <p className="mb-4 text-sm text-role-3">{error}</p> : null}
            <SubmitButton
              pendingText="Preparando... isso pode levar até 1 minuto, não recarregue a página"
              className="rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-paper transition-colors hover:opacity-90"
            >
              Continuar minha rota →
            </SubmitButton>
          </form>
        </>
      )}
    </div>
  );
}
