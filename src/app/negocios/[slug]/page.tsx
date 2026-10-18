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

export default async function IdeiaDeNegocioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const user = await requireUser();
  const ideia = await db.ideiaNegocio.findFirst({ where: { slug, status: "APROVADO" } });
  const conteudo = ideia ? lerConteudo(ideia.conteudo) : null;
  if (!ideia || !conteudo) notFound();

  const [totalFavoritos, eFavoritaQtd, tipo, dbUser] = await Promise.all([
    db.ideiaFavorita.count({ where: { userId: user.id } }),
    db.ideiaFavorita.count({ where: { userId: user.id, ideiaId: ideia.id } }),
    getTipoAcesso(user.id),
    db.user.findUnique({ where: { id: user.id }, select: { name: true, email: true } }),
  ]);
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
