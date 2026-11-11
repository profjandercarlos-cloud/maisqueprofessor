import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { FaixaDaJornada } from "@/components/faixa-da-jornada";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/lib/db";
import { donoDoNegocio } from "@/lib/plano/dono-do-negocio";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { getOrCreateAdequacaoResponse } from "@/lib/adequacao/get-active-response";
import { AJUDA_ORCAMENTO, OPCOES_ORCAMENTO, PERGUNTA_ORCAMENTO, orcamentoValido } from "@/lib/adequacao/orcamento";
import { cotaDePlanos } from "@/lib/planos/cota";
import { criarPlano } from "./actions";

// A criação do plano roda aqui (Mapa de Execução + plano por ações, 1 a 2 minutos).
// maxDuration tem que ficar na page, não no arquivo "use server".
export const maxDuration = 300;

export default async function CriarPlanoPage({
  params,
  searchParams,
}: PageProps<"/adequacao/[possibilityId]">) {
  const { possibilityId } = await params;
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : undefined;

  const user = await requireActiveAccess();

  const possibility = await db.possibility.findUnique({
    where: { id: possibilityId },
    include: { round: { include: { diagnostic: true } }, plan: true },
  });
  if (!possibility || donoDoNegocio(possibility) !== user.id) notFound();
  if (possibility.plan) redirect(`/planos/${possibility.plan.id}`);

  const cota = cotaDePlanos(await db.plan.count({ where: { userId: user.id } }));
  // Criar um plano o torna o ativo e pausa o atual: a pessoa precisa saber disso antes de criar.
  const planoAtivo = await db.plan.findFirst({
    where: { userId: user.id, status: "ATIVO" },
    select: { possibility: { select: { titulo: true } } },
  });

  // Negócio fechado por conflito de orçamento: não há o que criar.
  if (possibility.status === "REJEITADA") {
    return (
      <div className="mx-auto w-full max-w-[640px] flex-1 px-5 pb-20">
        <AppHeader progressLabel="CRIAR PLANO" />
        <h1 className="mb-3 font-serif text-2xl font-medium tracking-tight text-petrol">{possibility.titulo}</h1>
        <p className="mb-5 text-[14.5px] text-ink-muted">
          Este negócio não coube nas condições que você informou, então não é possível criar um plano para ele.
        </p>
        <a href="/planos" className="text-[13px] font-semibold text-petrol hover:underline">
          ← Planos de execução
        </a>
      </div>
    );
  }

  // Se uma tentativa anterior falhou depois de a pessoa escolher, a escolha continua marcada.
  const response = await getOrCreateAdequacaoResponse(possibilityId);
  const salvo = (response.answers as Record<string, unknown>).orcamentoTotal12Semanas;
  const escolhido = orcamentoValido(salvo) ? salvo : undefined;

  return (
    <div className="mx-auto w-full max-w-[640px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="CRIAR PLANO" />
      <FaixaDaJornada atual="planos" />

      <a href="/planos" className="mb-4 inline-block text-[13px] font-semibold text-petrol hover:underline">
        ← Planos de execução
      </a>

      <span className="mb-3 inline-block rounded-full bg-badge-bg px-2.5 py-[5px] font-mono text-[11px] tracking-[0.12em] text-badge-text uppercase">
        Plano de execução
      </span>
      <h1 className="mb-3 font-serif text-[clamp(25px,5vw,32px)] leading-[1.15] font-medium tracking-tight text-petrol">
        {possibility.titulo}
      </h1>
      <p className="mb-8 max-w-[52ch] text-[15px] leading-[1.6] text-ink-muted">
        Vamos montar o passo a passo, com checklist, para você colocar o primeiro serviço deste negócio no mercado. Falta
        só uma resposta.
      </p>

      <form action={criarPlano.bind(null, possibilityId)}>
        <fieldset className="mb-6">
          <legend className="mb-1 font-serif text-[18px] font-medium tracking-tight text-ink">{PERGUNTA_ORCAMENTO}</legend>
          <p className="mb-4 text-[13.5px] text-ink-muted">{AJUDA_ORCAMENTO}</p>
          <div className="flex flex-col gap-2.5">
            {OPCOES_ORCAMENTO.map((o) => (
              <label
                key={o.value}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-paper-raised px-4 py-3 text-[14.5px] text-ink transition-colors hover:border-petrol has-[:checked]:border-petrol has-[:checked]:bg-gold-soft"
              >
                <input
                  type="radio"
                  name="orcamento"
                  value={o.value}
                  required
                  defaultChecked={escolhido === o.value}
                  className="mt-[3px] h-4 w-4 shrink-0 accent-[var(--petrol)]"
                />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {error ? <p className="mb-4 max-w-[52ch] text-[14px] text-role-3">{error}</p> : null}

        {cota.esgotada ? (
          <p className="max-w-[52ch] text-[14px] text-ink-muted">
            Você já usou todos os {cota.limite} planos desta conta, então não é possível criar mais um.
          </p>
        ) : (
          <>
            {planoAtivo ? (
              <p className="mb-5 max-w-[52ch] rounded-lg bg-gold-soft px-4 py-3 text-[13.5px] leading-[1.55] text-ink">
                <span className="font-semibold">Este plano vai ser o seu plano ativo.</span> O plano atual, &quot;
                {planoAtivo.possibility.titulo}&quot;, fica pausado. O progresso dele fica guardado e você pode ativá-lo
                de novo em Planos de execução.
              </p>
            ) : null}
            <SubmitButton
              pendingText="Criando seu plano... pode levar 1 a 2 minutos, não feche esta página"
              className="rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-paper transition-colors hover:opacity-90"
            >
              Criar meu plano
            </SubmitButton>
            <p className="mt-3 max-w-[52ch] text-[12.5px] text-ink-muted">
              Este plano usa 1 dos seus {cota.limite} planos ({cota.usados} de {cota.limite} usados). Todo plano criado
              conta, mesmo que você ainda não o tenha executado.
            </p>
          </>
        )}
      </form>
    </div>
  );
}
