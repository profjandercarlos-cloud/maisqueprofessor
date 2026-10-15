import { AppHeader } from "@/components/app-header";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-active-access";
import { LIMITE_LISTA } from "@/lib/negocios/lista";
import { CATEGORIA_LABELS, CATEGORIA_ORDEM, TAG_LABELS } from "@/lib/negocios/tags";
import type { CategoriaNegocio, Prisma } from "@/generated/prisma/client";

const selectClass =
  "rounded-lg border border-line bg-paper px-3 py-2 text-[13.5px] text-ink outline-none focus:border-petrol";

export default async function NegociosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const texto = (k: string) => (typeof query[k] === "string" ? (query[k] as string).trim() : "");
  const q = texto("q");
  const categoriaParam = texto("categoria");
  const preparo = texto("preparo");
  const investimento = texto("investimento");
  const onde = texto("onde");

  const user = await requireUser();

  const where: Prisma.PequenoNegocioWhereInput = {
    status: "APROVADO",
    fichaGeradaEm: { not: null },
    ...(categoriaParam && CATEGORIA_LABELS[categoriaParam] ? { categoria: categoriaParam as CategoriaNegocio } : {}),
    ...(TAG_LABELS.preparo[preparo] ? { tagPreparo: preparo } : {}),
    ...(TAG_LABELS.investimentoInicial[investimento] ? { tagInvestimentoInicial: investimento } : {}),
    ...(TAG_LABELS.onde[onde] ? { tagOnde: onde } : {}),
    ...(q
      ? {
          OR: [
            { nome: { contains: q, mode: "insensitive" } },
            { posicionamento: { contains: q, mode: "insensitive" } },
            { oQueOClienteRecebe: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [negocios, naLista] = await Promise.all([
    db.pequenoNegocio.findMany({
      where,
      include: { subcategoria: true },
      orderBy: [{ codigo: "asc" }],
    }),
    db.negocioNaLista.findMany({ where: { userId: user.id }, select: { negocioId: true } }),
  ]);
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

  const opcoes = (m: Record<string, string>) =>
    Object.entries(m).map(([v, l]) => (
      <option key={v} value={v}>
        {l}
      </option>
    ));

  return (
    <div className="mx-auto w-full max-w-[860px] flex-1 px-5 pb-20">
      <AppHeader progressLabel="PEQUENOS NEGÓCIOS" />

      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-serif text-2xl font-medium tracking-tight text-petrol">Pequenos negócios</h1>
        <a
          href="/negocios/lista"
          className="rounded-full border border-petrol px-3.5 py-1.5 text-[13px] font-semibold text-petrol transition-colors hover:bg-gold-soft"
        >
          Minha lista · {idsNaLista.size} de {LIMITE_LISTA}
        </a>
      </div>
      <p className="mb-6 max-w-[62ch] text-[14.5px] text-ink-muted">
        Ideias de renda extra fora da sala de aula, organizadas por o que o cliente recebe. Abra cada uma para ver
        quem compra, quanto dá para cobrar, como começar pequeno e como o negócio pode crescer. Escolha até{" "}
        {LIMITE_LISTA} para a sua lista.
      </p>

      <form action="/negocios" className="mb-8 flex flex-wrap items-end gap-2.5">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou assunto…"
          className="min-w-[220px] flex-1 rounded-lg border border-line bg-paper px-3.5 py-2 text-[13.5px] text-ink outline-none focus:border-petrol"
        />
        <select name="categoria" defaultValue={categoriaParam} className={selectClass}>
          <option value="">Todas as categorias</option>
          {opcoes(CATEGORIA_LABELS)}
        </select>
        <select name="preparo" defaultValue={preparo} className={selectClass}>
          <option value="">Qualquer preparo</option>
          {opcoes(TAG_LABELS.preparo)}
        </select>
        <select name="investimento" defaultValue={investimento} className={selectClass}>
          <option value="">Qualquer investimento</option>
          {opcoes(TAG_LABELS.investimentoInicial)}
        </select>
        <select name="onde" defaultValue={onde} className={selectClass}>
          <option value="">De qualquer lugar</option>
          {opcoes(TAG_LABELS.onde)}
        </select>
        <button
          type="submit"
          className="rounded-lg border border-petrol px-4 py-2 text-[13.5px] font-semibold text-petrol transition-colors hover:bg-gold-soft"
        >
          Filtrar
        </button>
      </form>

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
                      const naMinhaLista = idsNaLista.has(n.id);
                      return (
                        <a
                          key={n.id}
                          href={`/negocios/${n.codigo}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper-raised px-4 py-3 text-[13.5px] transition-colors hover:border-petrol"
                        >
                          <span className="flex min-w-0 flex-col gap-0.5">
                            <span className="truncate font-medium text-ink">{n.nome}</span>
                            <span className="text-[12px] text-ink-muted">
                              {TAG_LABELS.preparo[n.tagPreparo] ?? n.tagPreparo} ·{" "}
                              {TAG_LABELS.investimentoInicial[n.tagInvestimentoInicial] ?? n.tagInvestimentoInicial} ·{" "}
                              {TAG_LABELS.onde[n.tagOnde] ?? n.tagOnde}
                            </span>
                          </span>
                          {naMinhaLista ? (
                            <span className="shrink-0 rounded-full bg-gold-soft px-2.5 py-[3px] font-mono text-[10px] font-semibold tracking-wide text-petrol uppercase">
                              Na sua lista
                            </span>
                          ) : null}
                        </a>
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
