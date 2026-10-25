import { notFound } from "next/navigation";
import { z } from "zod";
import { AppHeader } from "@/components/app-header";
import { ProgressoPlano, SeloStatusAcao } from "@/components/progresso-plano";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { STATUS_ACAO_META } from "@/lib/plano/acoes";
import { INVESTIMENTO_LABELS } from "@/lib/plano/investimento-labels";

// As respostas do questionário curto, em frases curtas, só para leitura: mudar uma
// delas pediria um plano novo (e uma vaga da cota).
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

export default async function PlanPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
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

  return (
    <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="PLANO DE EXECUÇÃO" />

      <a href="/planos" className="mb-4 inline-block text-[13px] font-semibold text-petrol hover:underline">
        ← Planos de execução
      </a>

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
          <section className="mb-6 rounded-[var(--radius-app)] border border-gold bg-gold-soft p-5">
            <p className="mb-3 font-mono text-[10.5px] tracking-[0.06em] text-gold uppercase">Em resumo</p>
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
          </section>

          <p className="mb-6 text-[13px] leading-[1.6] text-ink-muted">
            <span className="font-semibold text-ink">Suas condições neste plano: </span>
            {ESTAGIO_CURTO[plan.estagioInicial] ?? plan.estagioInicial} · {String(plan.tempoDisponivelHoras).replace(".", ",")} h por
            semana · investimento {INVESTIMENTO_LABELS[plan.investimentoFaixa]}
          </p>

          <section className="mb-8 rounded-[var(--radius-app)] border border-line bg-paper-raised p-5">
            <ProgressoPlano acoes={plan.acoes} />
          </section>

          <h2 className="mb-3 font-serif text-lg font-medium tracking-tight text-petrol">Suas ações, na ordem</h2>
          <ol className="flex flex-col gap-2.5">
            {plan.acoes.map((acao) => {
              const meta = STATUS_ACAO_META[acao.status];
              const feitos = acao.itens.filter((i) => i.feito).length;
              return (
                <li key={acao.id}>
                  <a
                    href={`/planos/${plan.id}/acoes/${acao.id}`}
                    className="flex items-start gap-3.5 rounded-[var(--radius-app)] border border-line bg-paper-raised p-4 transition-colors hover:border-petrol"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-[13px] font-semibold"
                      style={{ background: meta.corFundo, color: meta.cor }}
                    >
                      {acao.status === "CONCLUIDA" ? "✓" : acao.sequencia}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="font-serif text-[17px] font-medium text-ink">{acao.nome}</span>
                        <SeloStatusAcao status={acao.status} />
                      </span>
                      <span className="block text-[13.5px] leading-[1.5] text-ink-muted">{acao.objetivo}</span>
                      <span className="mt-1.5 block text-[12px] text-ink-muted">
                        {feitos} de {acao.itens.length} passos feitos
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
