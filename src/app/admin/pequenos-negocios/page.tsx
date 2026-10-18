import { BotaoConfirmar } from "@/components/botao-confirmar";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/lib/db";
import { CATEGORIAS_IDEIAS, categoriaValida } from "@/lib/ideias/categorias";
import type { CaminhoRendaStatus } from "@/generated/prisma/client";
import { importarRepositorio } from "./actions";

// Importar cria 105 registros e pode apagar o repositório antigo.
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

export default async function IdeiasAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const statusParam = typeof query.status === "string" ? query.status : undefined;
  const categoriaParam = typeof query.categoria === "string" ? query.categoria : undefined;
  const status = statusParam ? STATUS_FILTER_MAP[statusParam] : undefined;
  const categoria = categoriaParam && categoriaValida(categoriaParam) ? categoriaParam : undefined;
  const msg = typeof query.msg === "string" ? query.msg : undefined;
  const error = typeof query.error === "string" ? query.error : undefined;

  const [ideias, porStatus, porCategoria, antigos] = await Promise.all([
    db.ideiaNegocio.findMany({
      where: { ...(status ? { status } : {}), ...(categoria ? { categoria } : {}) },
      orderBy: [{ ordem: "asc" }],
      select: { id: true, nome: true, resumo: true, categoria: true, status: true, conteudoEditadoEm: true },
    }),
    db.ideiaNegocio.groupBy({ by: ["status"], _count: true }),
    db.ideiaNegocio.groupBy({ by: ["categoria"], _count: true }),
    db.pequenoNegocio.count(),
  ]);

  const countStatus = Object.fromEntries(porStatus.map((c) => [c.status, c._count])) as Record<string, number>;
  const countCategoria = Object.fromEntries(porCategoria.map((c) => [c.categoria, c._count])) as Record<string, number>;
  const total = Object.values(countStatus).reduce((a, b) => a + b, 0);
  const returnTo = filtroHref(statusParam, categoriaParam);

  const chip = (ativo: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
      ativo ? "border-petrol text-petrol" : "border-line text-ink hover:border-petrol"
    }`;

  const grupos = CATEGORIAS_IDEIAS.map((cat) => ({ cat, itens: ideias.filter((i) => i.categoria === cat.id) })).filter(
    (g) => g.itens.length > 0,
  );

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-medium tracking-tight text-petrol">Ideias de negócios</h1>
      <p className="mb-6 max-w-[65ch] text-[13.5px] text-ink-muted">
        Cada ideia aparece para os professores quando está aprovada. Abra uma para ler os 5 cards, ajustar o texto e
        aprovar, deixar pendente ou rejeitar.
      </p>

      {msg ? (
        <p className="mb-4 rounded-lg border border-gold bg-gold-soft px-4 py-2.5 text-[13.5px] text-ink">{msg}</p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-lg border border-role-3 bg-paper px-4 py-2.5 text-[13.5px] text-role-3">{error}</p>
      ) : null}

      <section className="mb-6 rounded-lg border border-line bg-paper-raised p-4">
        <p className="mb-1 font-serif text-[17px] font-medium text-petrol">Importar repositório</p>
        <p className="mb-3 text-[13px] text-ink-muted">
          {total} ideia(s) no banco · {antigos} negócio(s) do repositório antigo ainda guardado(s). Ideias já importadas
          nunca são sobrescritas. Tudo entra como pendente.
        </p>
        <form className="flex flex-wrap items-center gap-2.5">
          <SubmitButton
            pendingText="Importando..."
            formAction={importarRepositorio.bind(null, returnTo, "teste")}
            className="rounded-lg border border-petrol px-4 py-2 text-[13.5px] font-semibold text-petrol hover:bg-gold-soft"
          >
            Importar 5 de teste
          </SubmitButton>
          <BotaoConfirmar
            pendingText="Importando e apagando..."
            confirmacao="Importar as 105 ideias e APAGAR o repositório antigo de negócios? Isso não pode ser desfeito."
            formAction={importarRepositorio.bind(null, returnTo, "todos")}
            className="rounded-lg border border-role-3 px-4 py-2 text-[13.5px] font-semibold text-role-3 hover:bg-paper"
          >
            Importar as 105 e apagar os antigos
          </BotaoConfirmar>
        </form>
      </section>

      <div className="mb-3 flex flex-wrap gap-2">
        <a href={filtroHref(undefined, categoriaParam)} className={chip(!status)}>
          Todas ({total})
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
        {CATEGORIAS_IDEIAS.map((cat) => (
          <a key={cat.id} href={filtroHref(statusParam, cat.id)} className={chip(categoriaParam === cat.id)}>
            {cat.curto} ({countCategoria[cat.id] ?? 0})
          </a>
        ))}
      </div>

      <div className="flex flex-col gap-8">
        {grupos.map((g) => (
          <section key={g.cat.id}>
            <h2 className="mb-3 font-serif text-lg font-medium tracking-tight text-petrol">
              {g.cat.nome} ({g.itens.length})
            </h2>
            <div className="flex flex-col gap-2">
              {g.itens.map((i) => (
                <a
                  key={i.id}
                  href={`/admin/pequenos-negocios/${i.id}`}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-[13.5px] transition-colors hover:border-petrol ${STATUS_ROW_COLORS[i.status]}`}
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-medium text-ink">{i.nome}</span>
                    <span className="truncate text-[12px] text-ink-muted">
                      {i.resumo}
                      {i.conteudoEditadoEm ? " · texto ajustado" : ""}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-[3px] font-mono text-[10.5px] tracking-wide uppercase ${STATUS_BADGE_COLORS[i.status]}`}
                  >
                    {STATUS_LABELS[i.status]}
                  </span>
                </a>
              ))}
            </div>
          </section>
        ))}
        {grupos.length === 0 ? (
          <p className="text-[14px] text-ink-muted">
            Nenhuma ideia encontrada. Se ainda não importou, use &quot;Importar 5 de teste&quot; acima.
          </p>
        ) : null}
      </div>
    </div>
  );
}
