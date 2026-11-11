import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { CardPlanoProf } from "@/components/card-plano-prof";
import { FavoritoButton } from "@/components/favorito-button";
import { IdeiaView } from "@/components/ideia-view";
import { db } from "@/lib/db";
import { getTipoAcesso, requireUser } from "@/lib/auth/require-active-access";
import { montarLinkCompra } from "@/lib/hotmart/checkout";
import { categoriaDaIdeia } from "@/lib/ideias/categorias";
import { lerConteudo } from "@/lib/ideias/conteudo";
import { PLANOS_DOS_FAVORITOS_DISPONIVEIS } from "@/lib/negocios/favoritos";
import { cotaDePlanos } from "@/lib/planos/cota";
import { SubmitButton } from "@/components/submit-button";
import { criarPlanoDaIdeia } from "@/app/planos/actions";

export default async function IdeiaDeNegocioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const user = await requireUser();
  const ideia = await db.ideiaNegocio.findFirst({ where: { slug, status: "APROVADO" } });
  const conteudo = ideia ? lerConteudo(ideia.conteudo) : null;
  if (!ideia || !conteudo) notFound();

  const [totalFavoritos, eFavoritaQtd, tipo, dbUser, negocioDaIdeia, totalPlanos] = await Promise.all([
    db.ideiaFavorita.count({ where: { userId: user.id } }),
    db.ideiaFavorita.count({ where: { userId: user.id, ideiaId: ideia.id } }),
    getTipoAcesso(user.id),
    db.user.findUnique({ where: { id: user.id }, select: { name: true, email: true } }),
    db.possibility.findUnique({
      where: { userId_ideiaId: { userId: user.id, ideiaId: ideia.id } },
      select: { status: true, plan: { select: { id: true } } },
    }),
    db.plan.count({ where: { userId: user.id } }),
  ]);
  const cota = cotaDePlanos(totalPlanos);
  const eFavorita = eFavoritaQtd > 0;
  const pago = tipo === "pago";
  const linkCompra = montarLinkCompra(dbUser?.email ?? user.email, dbUser?.name);

  return (
    <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="IDEIAS DE NEGÓCIOS" />

      <a href="/negocios" className="mb-4 inline-block text-[13px] font-semibold text-petrol hover:underline">
        ← Todas as ideias de negócios
      </a>

      <IdeiaView
        conteudo={conteudo}
        categoria={categoriaDaIdeia(ideia.categoria)?.nome ?? ""}
        acao={<FavoritoButton slug={ideia.slug} favorito={eFavorita} />}
      />

      {!pago ? <CardPlanoProf linkCompra={linkCompra} /> : null}

      {pago && PLANOS_DOS_FAVORITOS_DISPONIVEIS ? (
        <section className="mt-6 rounded-[var(--radius-app)] border border-gold bg-gold-soft p-5">
          <h2 className="mb-1 font-serif text-[18px] font-medium tracking-tight text-petrol">Quer executar esta ideia?</h2>
          {negocioDaIdeia?.plan ? (
            <>
              <p className="mb-3 text-[14px] leading-[1.55] text-ink">Você já criou o plano desta ideia.</p>
              <a
                href={`/planos/${negocioDaIdeia.plan.id}`}
                className="inline-block rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
              >
                Ver o plano desta ideia →
              </a>
            </>
          ) : negocioDaIdeia?.status === "REJEITADA" ? (
            <p className="text-[14px] leading-[1.55] text-ink">
              Esta ideia não coube nas suas condições quando você tentou criar o plano, então não dá para criar um plano
              dela.
            </p>
          ) : cota.esgotada ? (
            <p className="text-[14px] leading-[1.55] text-ink">
              Você já usou os {cota.limite} planos de execução desta conta, então não dá para criar mais um.
            </p>
          ) : (
            <>
              <p className="mb-3 text-[14px] leading-[1.55] text-ink">
                Esta ideia vira um plano de execução: as ações em ordem, cada uma com checklist. Você pode ter até{" "}
                {cota.limite} planos ({cota.usados} de {cota.limite} usados), e só um fica ativo por vez.
              </p>
              <form action={criarPlanoDaIdeia.bind(null, ideia.id)}>
                <SubmitButton
                  pendingText="Abrindo..."
                  className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90"
                >
                  {negocioDaIdeia ? "Continuar a criação do plano →" : "Criar o plano desta ideia →"}
                </SubmitButton>
              </form>
            </>
          )}
        </section>
      ) : null}

      <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-app)] border border-line bg-paper-raised p-5">
        <p className="text-[14.5px] text-ink">Gostou? Favorite para voltar a esta ideia depois.</p>
        <div className="flex flex-wrap items-center gap-3">
          <FavoritoButton slug={ideia.slug} favorito={eFavorita} variante="botao" />
          {totalFavoritos > 0 ? (
            <a href="/negocios/favoritos" className="text-[13px] font-semibold text-petrol hover:underline">
              Ver meus favoritos
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}
