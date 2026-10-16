import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-active-access";
import { FavoritoButton } from "@/components/favorito-button";
import { LivroIcon, LugarIcon, RelogioIcon } from "@/components/ficha-icons";
import { ONDE_LABELS, lerFicha, numerosDaFicha } from "@/lib/negocios/ficha";
import { CATEGORIA_CURTO, CATEGORIA_DESCRICAO, CATEGORIA_LABELS, CATEGORIA_ORDEM } from "@/lib/negocios/tags";
import type { CategoriaNegocio, Prisma } from "@/generated/prisma/client";

function Selo({ icone, texto }: { icone: React.ReactNode; texto: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-muted">
      <span className="text-gold">{icone}</span>
      {texto}
    </span>
  );
}

export default async function NegociosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const categoriaParam = typeof query.categoria === "string" ? query.categoria : "";
  const categoriaAtiva = CATEGORIA_LABELS[categoriaParam] ? (categoriaParam as CategoriaNegocio) : null;

  const user = await requireUser();

  const visiveis: Prisma.PequenoNegocioWhereInput = { status: "APROVADO", fichaGeradaEm: { not: null } };

  const [negocios, porCategoria, naLista] = await Promise.all([
    db.pequenoNegocio.findMany({
      where: { ...visiveis, ...(categoriaAtiva ? { categoria: categoriaAtiva } : {}) },
      include: { subcategoria: true },
      orderBy: [{ codigo: "asc" }],
    }),
    db.pequenoNegocio.groupBy({ by: ["categoria"], where: visiveis, _count: true }),
    db.negocioNaLista.findMany({ where: { userId: user.id }, select: { negocioId: true } }),
  ]);
  const contagem = Object.fromEntries(porCategoria.map((c) => [c.categoria, c._count])) as Record<string, number>;
  const totalVisiveis = Object.values(contagem).reduce((a, b) => a + b, 0);
  const idsNaLista = new Set(naLista.map((l) => l.negocioId));

  const grupos = CATEGORIA_ORDEM.map((cat) => {
    const doGrupo = negocios.filter((n) => n.categoria === cat);
    const subs = new Map<string, { nome: string; itens: typeof doGrupo }>();
    for (const n of doGrupo) {
      const s = subs.get(n.subcategoriaId) ?? { nome: n.subcategoria.nome, itens: [] };
      s.itens.push(n);
      subs.set(n.subcategoriaId, s);
    }
    return { cat, subs: [...subs.values()], qtd: doGrupo.length };
  }).filter((g) => g.qtd > 0);

  const chip = (ativo: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 text-[13.5px] font-medium whitespace-nowrap transition-colors ${
      ativo ? "border-gold bg-gold-soft text-petrol" : "border-line bg-paper-raised text-ink hover:border-petrol"
    }`;

  return (
    <div className="mx-auto w-full max-w-[860px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="PEQUENOS NEGÓCIOS" />

      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-serif text-[clamp(28px,5.5vw,38px)] leading-[1.1] font-medium tracking-tight text-petrol">
          Pequenos negócios <span className="text-gold">para professores</span>
        </h1>
        <a
          href="/negocios/favoritos"
          className="inline-flex items-center gap-2 rounded-full border border-petrol px-3.5 py-1.5 text-[13px] font-semibold text-petrol transition-colors hover:bg-gold-soft"
        >
          <svg viewBox="0 0 18 18" fill="currentColor" className="h-4 w-4 text-role-3" aria-hidden>
            <path d="M9 15.5s-6-3.6-6-8.1A3.4 3.4 0 019 5.6a3.4 3.4 0 016 1.8c0 4.5-6 8.1-6 8.1z" />
          </svg>
          Meus favoritos · {idsNaLista.size}
        </a>
      </div>
      <p className="mb-6 max-w-[62ch] text-[14.5px] text-ink-muted">
        Ideias de renda extra fora da sala de aula, organizadas por o que o cliente recebe. Abra cada uma para ver
        quem compra, quanto dá para cobrar, como começar pequeno e como o negócio pode crescer. Toque no coração
        dos que você quiser guardar.
      </p>

      <nav aria-label="Categorias" className="-mx-5 mb-2 flex gap-2 overflow-x-auto px-5 pb-2">
        <a href="/negocios" className={chip(!categoriaAtiva)} aria-current={!categoriaAtiva ? "page" : undefined}>
          Todos · {totalVisiveis}
        </a>
        {CATEGORIA_ORDEM.map((cat) => (
          <a
            key={cat}
            href={`/negocios?categoria=${cat}`}
            className={chip(categoriaAtiva === cat)}
            aria-current={categoriaAtiva === cat ? "page" : undefined}
          >
            {CATEGORIA_CURTO[cat]} · {contagem[cat] ?? 0}
          </a>
        ))}
      </nav>
      <p className="mb-8 min-h-[1.5em] max-w-[62ch] text-[14px] text-ink-muted">
        {categoriaAtiva ? CATEGORIA_DESCRICAO[categoriaAtiva] : ""}
      </p>

      <div className="flex flex-col gap-8">
        {grupos.map((g) => (
          <section key={g.cat}>
            <h2 className="mb-3 font-serif text-lg font-medium tracking-tight text-petrol">
              {CATEGORIA_LABELS[g.cat]}
            </h2>
            <div className="flex flex-col gap-5">
              {g.subs.map((s) => (
                <div key={s.nome}>
                  <p className="mb-2 font-mono text-[11px] tracking-[0.06em] text-gold uppercase">{s.nome}</p>
                  <div className="flex flex-col gap-2">
                    {s.itens.map((n) => {
                      const ficha = lerFicha(n.ficha);
                      const numeros = numerosDaFicha(n);
                      return (
                        <div key={n.id} className="relative">
                        <a
                          href={`/negocios/${n.codigo}`}
                          className="flex items-start gap-3 rounded-lg border border-line bg-paper-raised py-3.5 pr-14 pl-4 transition-colors hover:border-petrol"
                        >
                          <span className="flex min-w-0 flex-col gap-1.5">
                            <span className="text-[15px] font-medium text-ink">{n.nome}</span>
                            {ficha ? (
                              <span className="line-clamp-2 text-[13.5px] leading-[1.5] text-ink-muted">{ficha.vende}</span>
                            ) : null}
                            <span className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1">
                              <Selo icone={<RelogioIcon className="h-4 w-4" />} texto={numeros.horas} />
                              <Selo icone={<LivroIcon className="h-4 w-4" />} texto={numeros.preparo} />
                              <Selo
                                icone={<LugarIcon className="h-4 w-4" />}
                                texto={ONDE_LABELS[n.tagOnde] ?? "Local não informado"}
                              />
                            </span>
                          </span>
                        </a>
                        {/* Fora do <a>: botão dentro de link navegaria ao clicar. */}
                        <div className="absolute top-2.5 right-2.5">
                          <FavoritoButton codigo={n.codigo} favorito={idsNaLista.has(n.id)} />
                        </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
        {grupos.length === 0 ? (
          <p className="text-[14px] text-ink-muted">
            Nenhum negócio encontrado. Se não houver filtros, o catálogo ainda está sendo preparado.
          </p>
        ) : null}
      </div>
    </div>
  );
}
