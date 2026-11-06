import { AppHeader } from "@/components/app-header";
import { PapelIcon, PAPEL_LABELS } from "@/components/papel-icon";
import { db } from "@/lib/db";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { categoriaDaIdeia } from "@/lib/ideias/categorias";
import { PLANOS_DOS_FAVORITOS_DISPONIVEIS } from "@/lib/negocios/favoritos";
import { resumoDasAcoes } from "@/lib/plano/acoes";
import { LIMITE_PLANOS, cotaDePlanos } from "@/lib/planos/cota";
import { ProgressoPlano } from "@/components/progresso-plano";
import { activatePlan, criarPlanoDeFavorito } from "./actions";
import { SubmitButton } from "@/components/submit-button";

const STATUS_LABELS: Record<string, string> = {
  ATIVO: "Ativo",
  PAUSADO: "Pausado",
  CONGELADO: "Congelado",
};

const tituloSecao = "mb-1 font-serif text-lg font-medium tracking-tight text-petrol";
const subtitulo = "mb-2 flex items-baseline gap-2 font-mono text-[11px] tracking-[0.08em] text-gold uppercase";

export default async function PlanosPage({ searchParams }: PageProps<"/planos">) {
  const user = await requireActiveAccess();
  const { conflito } = await searchParams;
  const avisoConflito = typeof conflito === "string" && conflito ? conflito : null;

  const plans = await db.plan.findMany({
    where: { userId: user.id },
    include: { possibility: true, acoes: { orderBy: { sequencia: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  const cota = cotaDePlanos(plans.length);

  const planoAtivo = plans.find((p) => p.status === "ATIVO") ?? null;
  const outrosPlanos = plans.filter((p) => p.status !== "ATIVO");
  const resumoAtivo = planoAtivo ? resumoDasAcoes(planoAtivo.acoes) : null;
  const proximaDoAtivo =
    planoAtivo && resumoAtivo?.proxima != null
      ? planoAtivo.acoes.find((a) => a.sequencia === resumoAtivo.proxima)
      : undefined;

  const planPossibilityIds = new Set(plans.map((p) => p.possibilityId));

  const [availablePossibilities, favoritas, negociosDeFavoritos] = await Promise.all([
    db.possibility.findMany({
      where: {
        round: { diagnostic: { userId: user.id } },
        status: { not: "REJEITADA" },
        id: { notIn: [...planPossibilityIds] },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.ideiaFavorita.findMany({
      where: { userId: user.id, ideia: { status: "APROVADO" } },
      include: { ideia: { select: { id: true, slug: true, nome: true, resumo: true, categoria: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.possibility.findMany({
      where: { userId: user.id, ideiaId: { not: null } },
      select: { id: true, ideiaId: true, status: true, plan: { select: { id: true } } },
    }),
  ]);
  const negocioDaIdeia = new Map(negociosDeFavoritos.map((n) => [n.ideiaId, n]));

  return (
    <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="PLANOS DE EXECUÇÃO" />
      <h1 className="mb-2 font-serif text-2xl font-medium tracking-tight text-petrol">Planos de execução</h1>
      <p className="mb-6 text-[14px] leading-[1.55] text-ink-muted">
        Todo plano nasce de um negócio e vira uma lista de ações para você executar. Você pode criar até {LIMITE_PLANOS}{" "}
        planos, mas só um fica ativo por vez: é o que aparece no seu Painel.
      </p>

      {avisoConflito ? (
        <p className="mb-5 rounded-lg bg-gold-soft px-4 py-3 text-[13.5px] leading-[1.55] text-ink">
          <span className="font-semibold">Este negócio não coube nas suas condições agora. </span>
          {avisoConflito}
        </p>
      ) : null}

      {/* 1. O plano ativo: o que a pessoa está executando agora, sempre em primeiro. */}
      <h2 className={tituloSecao}>Plano ativo</h2>
      {planoAtivo ? (
        <article className="mt-2 mb-9 rounded-[var(--radius-app)] border-2 border-petrol bg-paper-raised p-5 shadow-[var(--shadow)]">
          <a
            href={`/planos/${planoAtivo.id}`}
            className="mb-4 flex items-center gap-2.5 font-serif text-[20px] leading-tight font-medium tracking-tight text-petrol hover:underline"
          >
            <PapelIcon papel={planoAtivo.possibility.papel} className="h-[20px] w-[20px] shrink-0 text-petrol" />
            <span title={PAPEL_LABELS[planoAtivo.possibility.papel]}>{planoAtivo.possibility.titulo}</span>
          </a>
          {planoAtivo.acoes.length > 0 ? (
            <>
              <div className="mb-4">
                <ProgressoPlano acoes={planoAtivo.acoes} mostrarLegenda={false} />
              </div>
              {proximaDoAtivo ? (
                <p className="mb-4 text-[13.5px] leading-[1.55] text-ink-muted">
                  <span className="font-semibold text-ink">Próxima ação:</span> {proximaDoAtivo.sequencia}.{" "}
                  {proximaDoAtivo.nome}
                </p>
              ) : (
                <p className="mb-4 text-[13.5px] leading-[1.55] text-ink-muted">Você concluiu todas as ações deste plano.</p>
              )}
            </>
          ) : (
            <p className="mb-4 text-[13.5px] leading-[1.55] text-ink-muted">
              Este plano foi criado no formato antigo, por semanas.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a
              href={`/planos/${planoAtivo.id}`}
              className="inline-block rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
            >
              Abrir o plano →
            </a>
            <a href="/" className="text-[13px] font-semibold text-petrol hover:underline">
              Ver no Painel
            </a>
          </div>
        </article>
      ) : (
        <p className="mt-2 mb-9 rounded-[var(--radius-app)] border border-gold bg-gold-soft p-5 text-[14px] leading-[1.55] text-ink">
          {plans.length > 0
            ? "Você não tem nenhum plano ativo agora. Escolha um dos seus planos abaixo para ativar, ou crie um novo."
            : "Você ainda não criou nenhum plano. Escolha um negócio abaixo para criar o primeiro."}
        </p>
      )}

      {/* 2. Os outros planos já criados, que podem ser ativados. */}
      {outrosPlanos.length > 0 ? (
        <>
          <h2 className={tituloSecao}>Outros planos que você criou</h2>
          <p className="mb-3 text-[13.5px] text-ink-muted">
            Ativar um deles coloca o plano no Painel e pausa o que está ativo. O progresso de cada plano fica guardado.
          </p>
          <div className="mb-9 flex flex-col gap-3">
            {outrosPlanos.map((plan) => {
              const concluidas = plan.acoes.filter((a) => a.status === "CONCLUIDA").length;
              const concluido = plan.acoes.length > 0 && concluidas === plan.acoes.length;
              return (
                <article key={plan.id} className="rounded-[var(--radius-app)] border border-line bg-paper-raised p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-line px-2.5 py-0.5 font-mono text-[10px] tracking-wide text-ink-muted uppercase">
                      {concluido ? "Concluído" : STATUS_LABELS[plan.status]}
                    </span>
                    <span className="text-[12px] text-ink-muted">
                      {plan.acoes.length > 0 ? `${concluidas} de ${plan.acoes.length} ações` : "Formato antigo"}
                    </span>
                  </div>
                  <a
                    href={`/planos/${plan.id}`}
                    className="mb-3 flex items-center gap-2 font-serif text-[17px] font-medium text-ink hover:underline"
                  >
                    <PapelIcon papel={plan.possibility.papel} className="h-[17px] w-[17px] shrink-0 text-petrol" />
                    <span title={PAPEL_LABELS[plan.possibility.papel]}>{plan.possibility.titulo}</span>
                  </a>
                  {plan.acoes.length > 0 ? (
                    <div className="mb-3">
                      <ProgressoPlano acoes={plan.acoes} mostrarLegenda={false} />
                    </div>
                  ) : null}
                  <form action={activatePlan.bind(null, plan.id)}>
                    <SubmitButton
                      pendingText="Ativando..."
                      className="rounded-lg border border-petrol px-4 py-1.5 text-[13px] font-semibold text-petrol transition-colors hover:bg-gold-soft"
                    >
                      Tornar este o plano ativo
                    </SubmitButton>
                  </form>
                </article>
              );
            })}
          </div>
        </>
      ) : null}

      {/* 3. Criar um novo plano: a cota e as duas origens possíveis, lado a lado na mesma seção. */}
      <section className="rounded-[var(--radius-app)] border border-line bg-paper-raised p-5">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3">
          <h2 className="font-serif text-lg font-medium tracking-tight text-petrol">Criar um novo plano</h2>
          <p className="text-[13px] font-semibold text-ink">
            {cota.usados} de {cota.limite} criados
          </p>
        </div>
        <div className="mb-3 flex gap-1.5" aria-hidden>
          {Array.from({ length: LIMITE_PLANOS }, (_, i) => (
            <span key={i} className={`h-2 flex-1 rounded-full ${i < cota.usados ? "bg-gold" : "bg-gold-soft"}`} />
          ))}
        </div>
        <p className="mb-5 text-[13.5px] leading-[1.55] text-ink-muted">
          {cota.esgotada
            ? "Você usou todos os planos. Cada plano criado conta, mesmo que você ainda não o tenha executado."
            : `${cota.restantes === 1 ? "Resta 1 plano" : `Restam ${cota.restantes} planos`} para criar. Cada plano criado conta, mesmo que você ainda não o tenha executado. Escolha de onde ele vem: de um negócio personalizado ou de uma ideia que você favoritou.`}
        </p>

        <h3 className={subtitulo}>
          Dos seus negócios personalizados
          <span className="text-ink-muted normal-case">{availablePossibilities.length > 0 ? `(${availablePossibilities.length} sem plano)` : ""}</span>
        </h3>
        {availablePossibilities.length === 0 ? (
          <p className="mb-6 text-[13.5px] text-ink-muted">
            Nenhum negócio personalizado sem plano.{" "}
            <a href="/diagnostico/concluido" className="font-semibold text-petrol hover:underline">
              Ver meus negócios
            </a>
          </p>
        ) : (
          <div className="mb-6 flex flex-col gap-2.5">
            {availablePossibilities.map((p) => {
              const conteudo = (
                <>
                  <span className="flex min-w-0 items-center gap-2">
                    <PapelIcon papel={p.papel} className="h-[16px] w-[16px] shrink-0 text-petrol" />
                    <span className="truncate" title={PAPEL_LABELS[p.papel]}>
                      {p.titulo}
                    </span>
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold text-petrol">
                    {cota.esgotada ? "Sem planos disponíveis" : "Criar plano →"}
                  </span>
                </>
              );
              const classe =
                "flex items-center justify-between gap-3 rounded-lg border border-line bg-paper px-4 py-3 text-[14.5px] text-ink";
              // Sem vaga na cota, o item deixa de ser link: não dá para criar mais um plano.
              return cota.esgotada ? (
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

        <h3 className={subtitulo}>
          Dos seus favoritos
          <span className="text-ink-muted normal-case">{favoritas.length > 0 ? `(${favoritas.length})` : ""}</span>
        </h3>
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
              {favoritas.map(({ id, ideia }) => {
                const negocio = negocioDaIdeia.get(ideia.id);
                const botao = "shrink-0 text-[13px] font-semibold text-petrol hover:underline";
                let acao;
                if (!PLANOS_DOS_FAVORITOS_DISPONIVEIS) {
                  acao = <span className="shrink-0 text-[13px] text-ink-muted">Em breve</span>;
                } else if (negocio?.plan) {
                  acao = (
                    <a href={`/planos/${negocio.plan.id}`} className={botao}>
                      Ver plano →
                    </a>
                  );
                } else if (negocio?.status === "REJEITADA") {
                  acao = <span className="shrink-0 text-[13px] text-ink-muted">Não coube nas suas condições</span>;
                } else if (negocio) {
                  acao = (
                    <a href={`/adequacao/${negocio.id}`} className={botao}>
                      Continuar →
                    </a>
                  );
                } else if (cota.esgotada) {
                  acao = <span className="shrink-0 text-[13px] text-ink-muted">Sem planos disponíveis</span>;
                } else {
                  acao = (
                    <form action={criarPlanoDeFavorito.bind(null, ideia.id)}>
                      <SubmitButton pendingText="Abrindo..." className={botao}>
                        Criar plano →
                      </SubmitButton>
                    </form>
                  );
                }
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper px-4 py-3 text-[14.5px] text-ink"
                  >
                    <span className="min-w-0">
                      <a href={`/negocios/${ideia.slug}`} className="block truncate font-medium hover:underline">
                        {ideia.nome}
                      </a>
                      <span className="block truncate text-[12px] text-ink-muted">
                        {categoriaDaIdeia(ideia.categoria)?.curto}
                      </span>
                    </span>
                    {acao}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
