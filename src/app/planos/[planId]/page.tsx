import { notFound } from "next/navigation";
import { z } from "zod";
import { AppHeader } from "@/components/app-header";
import { FaixaDaJornada } from "@/components/faixa-da-jornada";
import { ListaDeAcoes } from "@/components/lista-de-acoes";
import { MedalhasDoPlano } from "@/components/medalhas-do-plano";
import { ProgressoPlano, SeloStatusAcao } from "@/components/progresso-plano";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { STATUS_ACAO_META, resumoDasAcoes } from "@/lib/plano/acoes";
import { LEVEL_LABELS, LEVEL_ORDER } from "@/lib/plano/evolucao";
import { formatDate } from "@/lib/format-date";
import { INVESTIMENTO_LABELS } from "@/lib/plano/investimento-labels";

// As condições informadas ao criar o plano, só para leitura: mudar uma delas pediria um
// plano novo (e uma vaga da cota). Planos criados antes de out/2026 também guardam o
// estágio e as horas por semana; os novos guardam só o orçamento.
const ESTAGIO_CURTO: Record<string, string> = {
  NUNCA_FIZ: "Nunca fiz nada parecido",
  PESQUISEI_NAO_EXECUTEI: "Já pesquisei, mas não executei",
  FIZ_ISOLADO: "Já fiz algo parecido de forma isolada",
  TENHO_CASO_PORTFOLIO: "Já tenho um caso ou portfólio",
  ATUO_PARCIALMENTE: "Já atuo parcialmente nisso",
};

const relatorioSchema = z.object({
  versao: z.literal("acoes_v1"),
  encaixe: z.object({ classificacao: z.string(), explicacao: z.string() }),
  resumo: z.object({
    por_que_esse_plano: z.string(),
    resultado_minimo_viavel: z.string(),
    entrega_final: z.string(),
  }),
});

const AVISO_ENCAIXE: Record<string, string> = {
  cabe_com_adaptacao: "O plano precisou ser adaptado à sua realidade",
  construcao_medio_prazo: "Este plano constrói a base antes do primeiro serviço",
};

export default async function PlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ planId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { planId } = await params;
  const planoNovo = (await searchParams).novo === "1";
  const user = await requireActiveAccess();

  const plan = await db.plan.findUnique({
    where: { id: planId },
    include: {
      possibility: { select: { titulo: true } },
      acoes: { orderBy: { sequencia: "asc" }, include: { itens: { select: { feito: true } } } },
    },
  });
  if (!plan || plan.userId !== user.id) notFound();

  const relatorio = relatorioSchema.safeParse(plan.relatorio);
  const formatoAntigo = !relatorio.success || plan.acoes.every((a) => a.itens.length === 0);

  const resumo = resumoDasAcoes(plan.acoes);
  const proxima = resumo.proxima !== null ? plan.acoes.find((a) => a.sequencia === resumo.proxima) : undefined;
  const concluidas = plan.acoes
    .filter((a) => a.status === "CONCLUIDA")
    .sort((a, b) => (a.concluidaEm?.getTime() ?? 0) - (b.concluidaEm?.getTime() ?? 0));
  const comMarcos = plan.acoes.some((a) => a.marco);
  const nivelDoMarco = (sequencia: number) => {
    const marcos = plan.acoes.filter((a) => a.marco);
    const i = marcos.findIndex((a) => a.sequencia === sequencia);
    return i >= 0 ? LEVEL_LABELS[LEVEL_ORDER[i + 1]] : null;
  };

  return (
    <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="PLANO DE EXECUÇÃO" />
      <FaixaDaJornada atual="execucao" />

      <a href="/planos" className="mb-4 inline-block text-[13px] font-semibold text-petrol hover:underline">
        ← Planos de execução
      </a>

      {planoNovo && plan.status === "ATIVO" ? (
        <p className="mb-5 rounded-lg bg-gold-soft px-4 py-3 text-[13.5px] leading-[1.55] text-ink">
          <span className="font-semibold">Plano criado.</span> Ele agora é o seu plano ativo e aparece no Painel. Para
          trocar o plano ativo, use Planos de execução.
        </p>
      ) : null}

      <h1 className="mb-5 font-serif text-[clamp(26px,5vw,34px)] leading-[1.15] font-medium tracking-tight text-petrol">
        {plan.possibility.titulo}
      </h1>

      {formatoAntigo ? (
        <div className="rounded-[var(--radius-app)] border border-line bg-paper-raised p-5 text-[14.5px] leading-[1.6] text-ink">
          <p className="mb-2 font-semibold text-petrol">Este plano usa o formato antigo.</p>
          <p className="text-ink-muted">
            Os planos agora são uma lista de ações com checklist, e não mais semanas e tarefas. Este plano continua
            contando como um dos seus 5 planos. Para executar este negócio no formato novo, crie um novo plano a
            partir de{" "}
            <a href="/planos" className="font-semibold text-petrol hover:underline">
              Planos de execução
            </a>
            .
          </p>
        </div>
      ) : (
        <>
          {/* Painel de controle do plano: onde a pessoa está, a próxima ação e as medalhas. */}
          <section className="mb-5 rounded-[var(--radius-app)] border border-line bg-paper-raised p-5 shadow-[var(--shadow)]">
            <ProgressoPlano acoes={plan.acoes} />
            {comMarcos ? (
              <div className="mt-5 border-t border-line pt-4">
                <MedalhasDoPlano acoes={plan.acoes} />
              </div>
            ) : null}
          </section>

          {proxima ? (
            <section className="mb-5 rounded-[var(--radius-app)] border border-gold bg-gold-soft p-5">
              <p className="mb-1 font-mono text-[10.5px] tracking-[0.06em] text-gold uppercase">
                {proxima.status === "EM_ANDAMENTO" ? "Continue de onde parou" : "Sua próxima ação"}
              </p>
              <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
                <h2 className="font-serif text-[20px] font-medium tracking-tight text-ink">
                  {proxima.sequencia}. {proxima.nome}
                </h2>
                <SeloStatusAcao status={proxima.status} />
              </div>
              <p className="mb-3 text-[14px] leading-[1.55] text-ink-muted">{proxima.objetivo}</p>
              <a
                href={`/planos/${plan.id}/acoes/${proxima.id}`}
                className="inline-block rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
              >
                {proxima.status === "EM_ANDAMENTO" ? "Continuar esta ação →" : "Começar esta ação →"}
              </a>
            </section>
          ) : (
            <section className="mb-5 rounded-[var(--radius-app)] border border-gold bg-gold-soft p-5">
              <p className="mb-1 font-mono text-[10.5px] tracking-[0.06em] text-gold uppercase">Plano concluído</p>
              <h2 className="mb-1.5 font-serif text-[20px] font-medium tracking-tight text-ink">
                Você executou o plano inteiro.
              </h2>
              <p className="mb-3 text-[14px] leading-[1.55] text-ink-muted">
                Você colocou o primeiro serviço em prática e avaliou o que aconteceu. Agora é decidir o próximo passo:
                avançar com este negócio, ajustar a oferta ou começar um novo plano.
              </p>
              <a
                href="/planos"
                className="inline-block rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
              >
                Ver meus planos e criar outro →
              </a>
            </section>
          )}

          <section className="mb-8" aria-label="Todas as ações do plano">
            <h2 className="mb-3 font-serif text-lg font-medium tracking-tight text-petrol">Todas as suas ações, na ordem</h2>
            <ListaDeAcoes planId={plan.id} acoes={plan.acoes} atual={resumo.proxima} />
          </section>

          {concluidas.length > 0 ? (
            <section className="mb-8">
              <h2 className="mb-3 font-serif text-lg font-medium tracking-tight text-petrol">Suas conquistas</h2>
              <ul className="flex flex-col gap-1.5">
                {concluidas.map((a) => (
                  <li key={a.id} className="flex items-start gap-2.5 text-[14px] leading-[1.5] text-ink">
                    <span
                      className="mt-[2px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: STATUS_ACAO_META.CONCLUIDA.cor }}
                      aria-hidden
                    >
                      ✓
                    </span>
                    <span>
                      {a.nome}
                      {a.concluidaEm ? (
                        <span className="text-ink-muted">
                          {" "}
                          · concluída em {formatDate(a.concluidaEm, { day: "2-digit", month: "long", year: "numeric" })}
                        </span>
                      ) : null}
                      {a.marco ? (
                        <span className="font-semibold text-petrol">
                          {" "}
                          · medalha {nivelDoMarco(a.sequencia)}: {a.marco}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <details className="mt-8 rounded-[var(--radius-app)] border border-line bg-paper-raised p-5">
            <summary className="cursor-pointer font-serif text-[16px] font-medium tracking-tight text-petrol">
              Sobre este plano
            </summary>
            <div className="mt-4">
            <dl className="flex flex-col gap-3 text-[14.5px] leading-[1.6] text-ink">
              <div>
                <dt className="font-semibold text-petrol">Por que este plano</dt>
                <dd>{relatorio.data!.resumo.por_que_esse_plano}</dd>
              </div>
              <div>
                <dt className="font-semibold text-petrol">Conta como feito quando</dt>
                <dd>{relatorio.data!.resumo.resultado_minimo_viavel}</dd>
              </div>
              <div>
                <dt className="font-semibold text-petrol">No final você terá</dt>
                <dd>{relatorio.data!.resumo.entrega_final}</dd>
              </div>
            </dl>
            {AVISO_ENCAIXE[relatorio.data!.encaixe.classificacao] ? (
              <p className="mt-3 border-t border-line pt-3 text-[13px] text-ink-muted">
                <span className="font-semibold text-petrol">{AVISO_ENCAIXE[relatorio.data!.encaixe.classificacao]}:</span>{" "}
                {relatorio.data!.encaixe.explicacao}
              </p>
            ) : null}
          <p className="mt-4 text-[13px] leading-[1.6] text-ink-muted">
            <span className="font-semibold text-ink">Suas condições neste plano: </span>
            {plan.tempoDisponivelHoras > 0
              ? `${ESTAGIO_CURTO[plan.estagioInicial] ?? plan.estagioInicial} · ${String(plan.tempoDisponivelHoras).replace(".", ",")} h por semana · `
              : ""}
            investimento {INVESTIMENTO_LABELS[plan.investimentoFaixa]}
          </p>

            </div>
          </details>
        </>
      )}
    </div>
  );
}
