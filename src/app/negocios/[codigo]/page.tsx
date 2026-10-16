import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { FavoritoButton } from "@/components/favorito-button";
import { FichaProfessorView } from "@/components/ficha-professor";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-active-access";
import { lerFicha, numerosDaFicha } from "@/lib/negocios/ficha";
import { CATEGORIA_LABELS } from "@/lib/negocios/tags";

export default async function NegocioPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;

  const user = await requireUser();
  const negocio = await db.pequenoNegocio.findFirst({
    where: { codigo, status: "APROVADO", fichaGeradaEm: { not: null } },
    include: { subcategoria: true },
  });
  const ficha = negocio ? lerFicha(negocio.ficha) : null;
  if (!negocio || !ficha) notFound();

  const favoritos = await db.negocioNaLista.count({ where: { userId: user.id } });
  const eFavorito =
    (await db.negocioNaLista.count({ where: { userId: user.id, negocioId: negocio.id } })) > 0;

  return (
    <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="PEQUENOS NEGÓCIOS" />

      <a href="/negocios" className="mb-4 inline-block text-[13px] font-semibold text-petrol hover:underline">
        ← Todos os pequenos negócios
      </a>

      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="mb-1.5 font-mono text-[10.5px] tracking-wide text-ink-muted uppercase">
            {CATEGORIA_LABELS[negocio.categoria]} · {negocio.subcategoria.nome}
          </p>
          <h1 className="font-serif text-[clamp(25px,5vw,32px)] leading-[1.15] font-medium tracking-tight text-petrol">
            {negocio.nome}
          </h1>
        </div>
        <FavoritoButton codigo={negocio.codigo} favorito={eFavorito} />
      </div>

      <FichaProfessorView ficha={ficha} numeros={numerosDaFicha(negocio)} />

      <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-app)] border border-line bg-paper-raised p-5">
        <p className="text-[14.5px] text-ink">Gostou? Favorite para voltar a este negócio depois.</p>
        <div className="flex flex-wrap items-center gap-3">
          <FavoritoButton codigo={negocio.codigo} favorito={eFavorito} variante="botao" />
          {favoritos > 0 ? (
            <a href="/negocios/favoritos" className="text-[13px] font-semibold text-petrol hover:underline">
              Ver meus favoritos
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}
