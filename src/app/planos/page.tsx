import { AppHeader } from "@/components/app-header";
import { PapelIcon, PAPEL_LABELS } from "@/components/papel-icon";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { categoriaDaIdeia } from "@/lib/ideias/categorias";
import { PLANOS_DOS_FAVORITOS_DISPONIVEIS } from "@/lib/negocios/favoritos";
import { LIMITE_PLANOS, cotaDePlanos } from "@/lib/planos/cota";
import { activatePlan } from "./actions";
import { SubmitButton } from "@/components/submit-button";

const STATUS_LABELS: Record<string, string> = {
  ATIVO: "Ativo",
  PAUSADO: "Pausado",
  CONGELADO: "Congelado",
};

const tituloSecao = "mb-1 font-serif text-lg font-medium tracking-tight text-petrol";

export default async function PlanosPage() {
  const user = await requireActiveAccess();

  const plans = await db.plan.findMany({
    where: { userId: user.id },
    include: { possibility: true, weeks: true },
    orderBy: { createdAt: "asc" },
  });
  const cota = cotaDePlanos(plans.length);

  const planPossibilityIds = new Set(plans.map((p) => p.possibilityId));

  const [availablePossibilities, favoritas] = await Promise.all([
    db.possibility.findMany({
      where: {
        round: { diagnostic: { userId: user.id } },
        status: { not: "REJEITADA" },
        id: { notIn: [...planPossibilityIds] },
      },
      include: { acoesEspecificacao: true },
      orderBy: { createdAt: "desc" },
    }),
    db.ideiaFavorita.findMany({
      where: { userId: user.id, ideia: { status: "APROVADO" } },
      include: { ideia: { select: { slug: true, nome: true, resumo: true, categoria: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="PLANOS DE EXECUÇÃO" />
      <h1 className="mb-5 font-serif text-2xl font-medium tracking-tight text-petrol">Planos de execução</h1>

      {/* Cota: todo plano criado conta, mesmo sem execução (a criação usa IA). */}
      <section className="mb-9 rounded-[var(--radius-app)] border border-gold bg-paper-raised p-5">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <p className="font-serif text-[19px] font-medium tracking-tight text-petrol">
            {cota.usados} de {cota.limite} planos
          </p>
          <p className="text-[13px] text-ink-muted">
            {cota.esgotada
              ? "Você usou todos os planos"
              : `${cota.restantes} ${cota.restantes === 1 ? "plano disponível" : "planos disponíveis"}`}
          </p>
        </div>
        <div className="mb-3 flex gap-1.5" aria-hidden>
          {Array.from({ length: LIMITE_PLANOS }, (_, i) => (
            <span
              key={i}
              className={`h-2 flex-1 rounded-full ${i < cota.usados ? "bg-gold" : "bg-gold-soft"}`}
            />
          ))}
        </div>
        <p className="text-[13.5px] leading-[1.55] text-ink-muted">
          Cada plano criado conta, mesmo que você ainda não o tenha executado. Só 1 plano fica ativo (recebendo
          check-in) por vez.
        </p>
      </section>

      <h2 className={tituloSecao}>Seus planos</h2>
      {plans.length === 0 ? (
        <p className="mt-2 mb-10 text-[14.5px] text-ink-muted">Você ainda não tem nenhum plano criado.</p>
      ) : (
        <div className="mt-3 mb-10 flex flex-col gap-3">
          {plans.map((plan) => {
            const completedWeeks = plan.weeks.filter((w) => w.status === "CONCLUIDA").length;
            const isActive = plan.status === "ATIVO";
            return (
              <article
                key={plan.id}
                className="rounded-[var(--radius-app)] border border-line bg-paper-raised p-4"
                style={isActive ? { borderColor: "var(--petrol)" } : undefined}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span
                    className="rounded-full px-2.5 py-0.5 font-mono text-[10px] tracking-wide uppercase"
                    style={{
                      color: isActive ? "var(--petrol)" : "var(--ink-muted)",
                      background: isActive ? "var(--gold-soft)" : "var(--line)",
                    }}
                  >
                    {STATUS_LABELS[plan.status]}
                  </span>
                  <span className="text-[12px] text-ink-muted">
                    Semana {completedWeeks}/{plan.duracaoSemanas}
                  </span>
                </div>
                <a
                  href={`/planos/${plan.id}`}
                  className="mb-3 flex items-center gap-2 font-serif text-[17px] font-medium text-ink hover:underline"
                >
                  <PapelIcon
                    papel={plan.possibility.papel}
                    className="h-[17px] w-[17px] shrink-0 text-petrol"
                  />
                  <span title={PAPEL_LABELS[plan.possibility.papel]}>{plan.possibility.titulo}</span>
                </a>
                {!isActive ? (
                  <form action={activatePlan.bind(null, plan.id)}>
                    <SubmitButton
                      pendingText="Ativando..."
                      className="rounded-lg border border-petrol px-4 py-1.5 text-[13px] font-semibold text-petrol transition-colors hover:bg-gold-soft"
                    >
                      Tornar este o plano ativo
                    </SubmitButton>
                  </form>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <h2 className={tituloSecao}>De onde podem vir os seus planos</h2>
      <p className="mb-5 text-[13.5px] text-ink-muted">
        Todo plano nasce de um negócio. Você pode criar um a partir dos negócios personalizados que geramos para você
        ou das ideias de negócios que favoritou.
      </p>

      <h3 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-gold uppercase">Seus negócios personalizados</h3>
      {availablePossibilities.length === 0 ? (
        <p className="mb-7 text-[13.5px] text-ink-muted">
          Nenhum negócio personalizado sem plano.{" "}
          <a href="/diagnostico/concluido" className="font-semibold text-petrol hover:underline">
            Ver meus negócios
          </a>
        </p>
      ) : (
        <div className="mb-7 flex flex-col gap-2.5">
          {availablePossibilities.map((p) => {
            const especificacaoPendente =
              p.status === "APROVADA" &&
              p.acoesEspecificacao.length > 0 &&
              (p.acoesEspecificacao.some((a) => a.respondidoEm === null) || !p.feedbackEspecificacao);
            const conteudo = (
              <>
                <span className="flex min-w-0 items-center gap-2">
                  <PapelIcon papel={p.papel} className="h-[16px] w-[16px] shrink-0 text-petrol" />
                  <span className="truncate" title={PAPEL_LABELS[p.papel]}>
                    {p.titulo}
                  </span>
                </span>
                <span className="shrink-0 text-[13px] font-semibold text-petrol">
                  {cota.esgotada && !especificacaoPendente
                    ? "Sem planos disponíveis"
                    : especificacaoPendente
                      ? "Especificação pendente →"
                      : "Criar plano →"}
                </span>
              </>
            );
            const classe = `flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-[14.5px] text-ink ${
              especificacaoPendente ? "border-gold bg-gold-soft" : "border-line bg-paper-raised"
            }`;
            // Sem vaga na cota, o item deixa de ser link: não dá para criar mais um plano.
            return cota.esgotada && !especificacaoPendente ? (
              <div key={p.id} className={`${classe} opacity-70`}>
                {conteudo}
              </div>
            ) : (
              <a key={p.id} href={`/adequacao/${p.id}`} className={`${classe} hover:border-petrol`}>
                {conteudo}
              </a>
            );
          })}
        </div>
      )}

      <h3 className="mb-2 font-mono text-[11px] tracking-[0.08em] text-gold uppercase">Seus favoritos</h3>
      {favoritas.length === 0 ? (
        <p className="text-[13.5px] text-ink-muted">
          Você ainda não favoritou nenhuma ideia de negócio.{" "}
          <a href="/negocios" className="font-semibold text-petrol hover:underline">
            Ver as ideias de negócios
          </a>
        </p>
      ) : (
        <>
          {!PLANOS_DOS_FAVORITOS_DISPONIVEIS ? (
            <p className="mb-3 rounded-lg bg-gold-soft px-3.5 py-2.5 text-[13px] text-ink">
              Criar plano a partir de uma ideia favorita chega em breve. Seus favoritos já ficam guardados aqui.
            </p>
          ) : null}
          <div className="flex flex-col gap-2.5">
            {favoritas.map(({ id, ideia }) => (
              <div
                key={id}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper-raised px-4 py-3 text-[14.5px] text-ink"
              >
                <span className="min-w-0">
                  <a href={`/negocios/${ideia.slug}`} className="block truncate font-medium hover:underline">
                    {ideia.nome}
                  </a>
                  <span className="block truncate text-[12px] text-ink-muted">
                    {categoriaDaIdeia(ideia.categoria)?.curto}
                  </span>
                </span>
                <span className="shrink-0 text-[13px] text-ink-muted">
                  {!PLANOS_DOS_FAVORITOS_DISPONIVEIS
                    ? "Em breve"
                    : cota.esgotada
                      ? "Sem planos disponíveis"
                      : "Criar plano →"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
