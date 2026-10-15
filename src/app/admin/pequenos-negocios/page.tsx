import { SubmitButton } from "@/components/submit-button";
import { db } from "@/lib/db";
import type { CaminhoRendaStatus, CategoriaNegocio } from "@/generated/prisma/client";
import { CATEGORIA_LABELS, CATEGORIA_ORDEM, EVIDENCIA_LABELS, TAG_LABELS } from "@/lib/negocios/tags";
import { gerarFichasPendentes } from "./actions";

// Gerar as fichas pendentes roda várias chamadas de IA numa só requisição.
export const maxDuration = 300;

const STATUS_LABELS: Record<CaminhoRendaStatus, string> = {
  PENDENTE_REVISAO: "Pendente",
  APROVADO: "Aprovado",
  REJEITADO: "Rejeitado",
};

const STATUS_FILTER_MAP: Record<string, CaminhoRendaStatus> = {
  pendente: "PENDENTE_REVISAO",
  aprovado: "APROVADO",
  rejeitado: "REJEITADO",
};

const STATUS_ROW_COLORS: Record<CaminhoRendaStatus, string> = {
  PENDENTE_REVISAO: "border-yellow-300 bg-yellow-50",
  APROVADO: "border-green-300 bg-green-50",
  REJEITADO: "border-red-300 bg-red-50",
};

const STATUS_BADGE_COLORS: Record<CaminhoRendaStatus, string> = {
  PENDENTE_REVISAO: "bg-yellow-200 text-yellow-900",
  APROVADO: "bg-green-200 text-green-900",
  REJEITADO: "bg-red-200 text-red-900",
};

function filtroHref(status?: string, categoria?: string) {
  const p = new URLSearchParams();
  if (status) p.set("status", status);
  if (categoria) p.set("categoria", categoria);
  const qs = p.toString();
  return `/admin/pequenos-negocios${qs ? `?${qs}` : ""}`;
}

export default async function PequenosNegociosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const statusParam = typeof query.status === "string" ? query.status : undefined;
  const categoriaParam = typeof query.categoria === "string" ? query.categoria : undefined;
  const status = statusParam ? STATUS_FILTER_MAP[statusParam] : undefined;
  const categoria = categoriaParam && CATEGORIA_LABELS[categoriaParam] ? (categoriaParam as CategoriaNegocio) : undefined;
  const msg = typeof query.msg === "string" ? query.msg : undefined;

  const [negocios, porStatus, porCategoria, semFicha] = await Promise.all([
    db.pequenoNegocio.findMany({
      where: { ...(status ? { status } : {}), ...(categoria ? { categoria } : {}) },
      include: { subcategoria: true },
      orderBy: [{ codigo: "asc" }],
    }),
    db.pequenoNegocio.groupBy({ by: ["status"], _count: true }),
    db.pequenoNegocio.groupBy({ by: ["categoria"], _count: true }),
    db.pequenoNegocio.count({ where: { fichaGeradaEm: null } }),
  ]);

  const countStatus = Object.fromEntries(porStatus.map((c) => [c.status, c._count])) as Record<string, number>;
  const countCategoria = Object.fromEntries(porCategoria.map((c) => [c.categoria, c._count])) as Record<string, number>;
  const total = Object.values(countStatus).reduce((a, b) => a + b, 0);

  const chip = (ativo: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
      ativo ? "border-petrol text-petrol" : "border-line text-ink hover:border-petrol"
    }`;

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

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-medium tracking-tight text-petrol">Pequenos Negócios</h1>
      <p className="mb-6 max-w-[65ch] text-[13.5px] text-ink-muted">
        Repositório interno organizado por o que o cliente recebe. Cada negócio tem o registro de pesquisa (só
        aqui) e a ficha do professor, que é o que o usuário lê. Um negócio só aparece para os usuários quando está
        aprovado e tem ficha.
      </p>

      {msg ? (
        <p className="mb-4 rounded-lg border border-gold bg-gold-soft px-4 py-2.5 text-[13.5px] text-ink">{msg}</p>
      ) : null}

      <form className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-paper-raised px-4 py-3">
        <SubmitButton
          pendingText="Gerando fichas (pode levar alguns minutos)..."
          formAction={gerarFichasPendentes.bind(null, filtroHref(statusParam, categoriaParam))}
          disabled={semFicha === 0}
          className="rounded-lg bg-gold px-4 py-2 text-[13.5px] font-semibold text-paper hover:opacity-90 disabled:opacity-50"
        >
          Gerar fichas pendentes (6 por vez)
        </SubmitButton>
        <span className="text-[13px] text-ink-muted">
          {semFicha === 0 ? "Todos os negócios têm ficha." : `${semFicha} negócio(s) ainda sem ficha.`}
        </span>
      </form>

      <div className="mb-3 flex flex-wrap gap-2">
        <a href={filtroHref(undefined, categoriaParam)} className={chip(!status)}>
          Todos ({total})
        </a>
        {Object.entries(STATUS_FILTER_MAP).map(([key, valor]) => (
          <a key={key} href={filtroHref(key, categoriaParam)} className={chip(statusParam === key)}>
            {STATUS_LABELS[valor]} ({countStatus[valor] ?? 0})
          </a>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        <a href={filtroHref(statusParam, undefined)} className={chip(!categoria)}>
          Todas as categorias
        </a>
        {CATEGORIA_ORDEM.map((cat) => (
          <a key={cat} href={filtroHref(statusParam, cat)} className={chip(categoriaParam === cat)}>
            {CATEGORIA_LABELS[cat]} ({countCategoria[cat] ?? 0})
          </a>
        ))}
      </div>

      <div className="flex flex-col gap-8">
        {grupos.map((g) => (
          <section key={g.cat}>
            <h2 className="mb-3 font-serif text-lg font-medium tracking-tight text-petrol">
              {CATEGORIA_LABELS[g.cat]} ({g.qtd})
            </h2>
            <div className="flex flex-col gap-5">
              {g.subs.map((s) => (
                <div key={s.nome}>
                  <p className="mb-2 font-mono text-[11px] tracking-[0.06em] text-gold uppercase">{s.nome}</p>
                  <div className="flex flex-col gap-2">
                    {s.itens.map((n) => (
                      <a
                        key={n.id}
                        href={`/admin/pequenos-negocios/${n.id}`}
                        className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-[13.5px] transition-colors hover:border-petrol ${STATUS_ROW_COLORS[n.status]}`}
                      >
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="truncate font-medium text-ink">{n.nome}</span>
                          <span className="text-[12px] text-ink-muted">
                            {EVIDENCIA_LABELS[n.nivelEvidencia]} · {TAG_LABELS.preparo[n.tagPreparo] ?? n.tagPreparo} ·{" "}
                            {TAG_LABELS.investimentoInicial[n.tagInvestimentoInicial] ?? n.tagInvestimentoInicial}
                            {n.fontesCompartilhadas ? " · fontes compartilhadas" : ""}
                            {n.fichaGeradaEm ? " · com ficha" : " · sem ficha"}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-[3px] font-mono text-[10.5px] tracking-wide uppercase ${STATUS_BADGE_COLORS[n.status]}`}
                        >
                          {STATUS_LABELS[n.status]}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
        {grupos.length === 0 ? <p className="text-[13.5px] text-ink-muted">Nenhum negócio nesse filtro.</p> : null}
      </div>
    </div>
  );
}
