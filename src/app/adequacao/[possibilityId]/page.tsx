import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { PROFUNDIDADE_CONFIG } from "@/lib/plano/formula";
import { WEEKDAY_LABELS } from "@/lib/plano/weekdays";
import { submitAdequacao } from "./actions";

const optionCardClass =
  "flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-paper px-4 py-3 text-[15px] text-ink transition-colors has-[:checked]:border-petrol has-[:checked]:bg-gold-soft";

const INVESTMENT_OPTIONS = [
  { value: "SEM_INVESTIMENTO", label: "Prefiro não investir nada por enquanto" },
  { value: "ATE_300", label: "Até R$300" },
  { value: "DE_300_A_1000", label: "Entre R$300 e R$1.000" },
  { value: "ACIMA_DE_1000", label: "Acima de R$1.000" },
];

const ACOMPANHAMENTO_OPTIONS = [
  { value: "Mínimo — só o check-in semanal, nada além disso", label: "Mínimo — só o check-in semanal, nada além disso" },
  { value: "Médio — check-in semanal + lembretes se eu atrasar", label: "Médio — check-in semanal + lembretes se eu atrasar" },
  { value: "Alto — quero me sentir bem acompanhado toda semana", label: "Alto — quero me sentir bem acompanhado toda semana" },
];

export default async function AdequacaoPage({
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
  if (!possibility || possibility.round.diagnostic.userId !== user.id) notFound();
  if (possibility.plan) redirect(`/planos/${possibility.plan.id}`);

  const action = submitAdequacao.bind(null, possibilityId);

  return (
    <div className="mx-auto w-full max-w-[680px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="ETAPA 06 / 10" />

      <span className="mb-[18px] inline-block rounded-full bg-badge-bg px-2.5 py-[5px] font-mono text-[11px] tracking-[0.12em] text-badge-text uppercase">
        Possibilidade aprovada
      </span>
      <h1 className="mb-2 font-serif text-2xl leading-snug font-medium tracking-tight text-petrol md:text-[27px]">
        {possibility.titulo}
      </h1>
      <p className="mb-8 max-w-[50ch] text-[14.5px] text-ink-muted">
        Só mais algumas perguntas para calibrar o plano ao seu tempo e ao seu jeito de acompanhar.
      </p>

      <form action={action} className="flex flex-col gap-8">
        <div>
          <label htmlFor="tempoDisponivelHoras" className="mb-2 block text-[15px] font-medium text-ink">
            Quantas horas por semana você tem disponível para isso?
          </label>
          <input
            id="tempoDisponivelHoras"
            name="tempoDisponivelHoras"
            type="number"
            min={1}
            max={40}
            step={0.5}
            required
            defaultValue={4}
            className="w-32 rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-petrol"
          />
        </div>

        <div>
          <p className="mb-2 text-[15px] font-medium text-ink">
            Quanto você tem disponível para investir, se precisar?
          </p>
          <div className="flex flex-col gap-2.5">
            {INVESTMENT_OPTIONS.map((opt) => (
              <label key={opt.value} className={optionCardClass}>
                <input type="radio" name="investimentoFaixa" value={opt.value} required className="mt-1 accent-petrol" />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[15px] font-medium text-ink">Qual a profundidade desejada do primeiro teste?</p>
          <div className="flex flex-col gap-2.5">
            {(Object.keys(PROFUNDIDADE_CONFIG) as (keyof typeof PROFUNDIDADE_CONFIG)[]).map((key) => {
              const config = PROFUNDIDADE_CONFIG[key];
              return (
                <label key={key} className={optionCardClass}>
                  <input type="radio" name="profundidade" value={key} required className="mt-1 accent-petrol" />
                  <span>
                    <span className="block font-medium">{config.label}</span>
                    <span className="block text-[13px] text-ink-muted">{config.descricao}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[15px] font-medium text-ink">Que nível de acompanhamento você quer?</p>
          <div className="flex flex-col gap-2.5">
            {ACOMPANHAMENTO_OPTIONS.map((opt) => (
              <label key={opt.value} className={optionCardClass}>
                <input type="radio" name="acompanhamento" value={opt.value} required className="mt-1 accent-petrol" />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="diaCheckin" className="mb-2 block text-[15px] font-medium text-ink">
            Em qual dia da semana você quer receber o check-in?
          </label>
          <select
            id="diaCheckin"
            name="diaCheckin"
            required
            defaultValue=""
            className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-petrol"
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

        {error ? <p className="text-sm text-role-3">{error}</p> : null}

        <button
          type="submit"
          className="rounded-lg bg-petrol px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-petrol-soft"
        >
          Gerar meu relatório e plano →
        </button>
      </form>
    </div>
  );
}
