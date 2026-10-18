import { AppHeader } from "@/components/app-header";
import { FavoritoButton } from "@/components/favorito-button";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-active-access";
import { CATEGORIAS_IDEIAS, categoriaDaIdeia, categoriaValida } from "@/lib/ideias/categorias";
import { lerConteudo } from "@/lib/ideias/conteudo";
import type { Prisma } from "@/generated/prisma/client";

export default async function IdeiasDeNegociosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const categoriaParam = typeof query.categoria === "string" ? query.categoria : "";
  const categoriaAtiva = categoriaValida(categoriaParam) ? categoriaParam : null;

  const user = await requireUser();

  const visiveis: Prisma.IdeiaNegocioWhereInput = { status: "APROVADO" };

  const [ideias, porCategoria, favoritas] = await Promise.all([
    db.ideiaNegocio.findMany({
      where: { ...visiveis, ...(categoriaAtiva ? { categoria: categoriaAtiva } : {}) },
      orderBy: [{ ordem: "asc" }],
      select: { id: true, slug: true, categoria: true, nome: true, resumo: true, conteudo: true },
    }),
    db.ideiaNegocio.groupBy({ by: ["categoria"], where: visiveis, _count: true }),
    db.ideiaFavorita.findMany({ where: { userId: user.id }, select: { ideiaId: true } }),
  ]);
  const idsFavoritos = new Set(favoritas.map((f) => f.ideiaId));
  const contagem = Object.fromEntries(porCategoria.map((c) => [c.categoria, c._count])) as Record<string, number>;
  const totalVisiveis = Object.values(contagem).reduce((a, b) => a + b, 0);

  const grupos = CATEGORIAS_IDEIAS.map((cat) => ({
    cat,
    itens: ideias.filter((i) => i.categoria === cat.id),
  })).filter((g) => g.itens.length > 0);

  const chip = (ativo: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 text-[13.5px] font-medium whitespace-nowrap transition-colors ${
      ativo ? "border-gold bg-gold-soft text-petrol" : "border-line bg-paper-raised text-ink hover:border-petrol"
    }`;

  return (
    <div className="mx-auto w-full max-w-[860px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="IDEIAS DE NEGÓCIOS" />

      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-serif text-[clamp(28px,5.5vw,38px)] leading-[1.1] font-medium tracking-tight text-petrol">
          Ideias de negócios <span className="text-gold">para professores</span>
        </h1>
        <a
          href="/negocios/favoritos"
          className="inline-flex items-center gap-2 rounded-full border border-petrol px-3.5 py-1.5 text-[13px] font-semibold text-petrol transition-colors hover:bg-gold-soft"
        >
          <svg viewBox="0 0 18 18" fill="currentColor" className="h-4 w-4 text-role-3" aria-hidden>
            <path d="M9 15.5s-6-3.6-6-8.1A3.4 3.4 0 019 5.6a3.4 3.4 0 016 1.8c0 4.5-6 8.1-6 8.1z" />
          </svg>
          Meus favoritos · {idsFavoritos.size}
        </a>
      </div>

      <nav aria-label="Categorias" className="mb-3 flex flex-wrap gap-2">
        <a href="/negocios" className={chip(!categoriaAtiva)} aria-current={!categoriaAtiva ? "page" : undefined}>
          Todas · {totalVisiveis}
        </a>
        {CATEGORIAS_IDEIAS.map((cat) => (
          <a
            key={cat.id}
            href={`/negocios?categoria=${cat.id}`}
            className={chip(categoriaAtiva === cat.id)}
            aria-current={categoriaAtiva === cat.id ? "page" : undefined}
          >
            {cat.curto} · {contagem[cat.id] ?? 0}
          </a>
        ))}
      </nav>
      <p className="mb-8 min-h-[1.5em] max-w-[62ch] text-[14px] text-ink-muted">
        {categoriaAtiva ? categoriaDaIdeia(categoriaAtiva)?.descricao : ""}
      </p>

      <div className="flex flex-col gap-9">
        {grupos.map((g) => (
          <section key={g.cat.id}>
            <h2 className="mb-3 font-serif text-lg font-medium tracking-tight text-petrol">{g.cat.nome}</h2>
            <div className="flex flex-col gap-2">
              {g.itens.map((i) => {
                const oferta = lerConteudo(i.conteudo)?.primeiroServico.oferta;
                return (
                  <div key={i.id} className="relative">
                    <a
                      href={`/negocios/${i.slug}`}
                      className="flex flex-col gap-1.5 rounded-lg border border-line bg-paper-raised py-3.5 pr-14 pl-4 transition-colors hover:border-petrol"
                    >
                      <span className="text-[15.5px] font-medium text-ink">{i.nome}</span>
                      <span className="line-clamp-2 text-[13.5px] leading-[1.5] text-ink-muted">{i.resumo}</span>
                      {oferta ? (
                        <span className="line-clamp-2 text-[13px] leading-[1.5] text-ink-muted">
                          <span className="font-semibold text-petrol">Para começar:</span> {oferta}
                        </span>
                      ) : null}
                    </a>
                    {/* Fora do <a>: botão dentro de link navegaria ao clicar. */}
                    <div className="absolute top-2.5 right-2.5">
                      <FavoritoButton slug={i.slug} favorito={idsFavoritos.has(i.id)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        {grupos.length === 0 ? (
          <p className="text-[14px] text-ink-muted">Nenhuma ideia disponível ainda. O catálogo está sendo preparado.</p>
        ) : null}
      </div>
    </div>
  );
}
