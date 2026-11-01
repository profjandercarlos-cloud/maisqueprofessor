import { SubmitButton } from "@/components/submit-button";
import { db } from "@/lib/db";
import { nomeDaCategoria } from "@/lib/dicas/categorias";
import { TETO_DE_LOTES } from "@/lib/dicas/escolher";
import { formatDateTime } from "@/lib/format-date";
import { alternarStatusDica, gerarLoteAgora } from "./actions";

// Gerar um lote leva cerca de um minuto: o tempo máximo fica aqui, na page, e não na Server Action.
export const maxDuration = 300;

const cardClass = "rounded-[var(--radius-app)] border border-line bg-paper-raised p-4";

export default async function AdminDicasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const aviso = typeof query.aviso === "string" ? query.aviso : undefined;
  const filtro = query.origem === "ia" ? "IA" : query.origem === "manual" ? "MANUAL" : null;

  const [dicas, vistas, reacoes, lotes] = await Promise.all([
    db.dica.findMany({
      where: filtro ? { origem: filtro } : undefined,
      orderBy: [{ lote: "desc" }, { chave: "asc" }],
    }),
    db.presenca.groupBy({ by: ["dicaId"], where: { dicaId: { not: null } }, _count: { _all: true } }),
    db.dicaReacao.groupBy({ by: ["dicaId", "tipo"], _count: { _all: true } }),
    db.dicaLote.findMany({ orderBy: { id: "desc" }, take: 6 }),
  ]);

  const nVistas = new Map(vistas.map((v) => [v.dicaId as string, v._count._all]));
  const nReacoes = new Map(reacoes.map((r) => [`${r.dicaId}:${r.tipo}`, r._count._all]));
  const conta = (id: string, tipo: string) => nReacoes.get(`${id}:${tipo}`) ?? 0;

  const ativas = dicas.filter((d) => d.status === "ATIVA").length;
  const concluidos = lotes.filter((l) => l.status === "CONCLUIDO").length;

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-medium tracking-tight text-petrol">Dicas da lista de presença</h1>
      <p className="mb-5 max-w-[70ch] text-[13.5px] text-ink-muted">
        O banco cresce sozinho: quando faltam poucas dicas inéditas para alguém, a IA gera um lote novo (até {TETO_DE_LOTES}{" "}
        lotes). Aqui você revisa o que foi gerado, aposenta dicas e acompanha como as pessoas reagem.
      </p>

      {aviso ? <p className="mb-5 rounded-lg bg-gold-soft px-4 py-2.5 text-[13.5px] text-ink">{aviso}</p> : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className={cardClass}>
          <p className="font-serif text-[26px] leading-none font-medium text-petrol">{ativas}</p>
          <p className="mt-1.5 text-[12.5px] text-ink-muted">dicas ativas (de {dicas.length})</p>
        </div>
        <div className={cardClass}>
          <p className="font-serif text-[26px] leading-none font-medium text-petrol">
            {concluidos} / {TETO_DE_LOTES}
          </p>
          <p className="mt-1.5 text-[12.5px] text-ink-muted">lotes automáticos concluídos (últimos 6 listados)</p>
        </div>
        <form action={gerarLoteAgora} className={`${cardClass} flex items-center`}>
          <SubmitButton
            pendingText="Gerando... pode levar 1 a 2 minutos"
            className="rounded-lg border border-petrol px-4 py-2 text-[13px] font-semibold text-petrol transition-colors hover:bg-gold-soft"
          >
            Gerar um lote agora
          </SubmitButton>
        </form>
      </div>

      {lotes.length > 0 ? (
        <ul className="mb-6 flex flex-col gap-1 text-[12.5px] text-ink-muted">
          {lotes.map((l) => (
            <li key={l.id}>
              Lote {l.id}: {l.status === "CONCLUIDO" ? `${l.quantidade} dicas` : l.status === "FALHOU" ? "falhou" : "em andamento"}{" "}
              · {formatDateTime(l.createdAt, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              {l.erro ? ` · ${l.erro.slice(0, 120)}` : ""}
            </li>
          ))}
        </ul>
      ) : null}

      <nav className="mb-4 flex gap-2 text-[13px]">
        {[
          { href: "/admin/dicas", rotulo: "Todas", ativo: !filtro },
          { href: "/admin/dicas?origem=ia", rotulo: "Geradas pela IA", ativo: filtro === "IA" },
          { href: "/admin/dicas?origem=manual", rotulo: "Escritas à mão", ativo: filtro === "MANUAL" },
        ].map((f) => (
          <a
            key={f.href}
            href={f.href}
            className={`rounded-full border px-3 py-1 font-medium ${f.ativo ? "border-petrol bg-petrol text-paper" : "border-line text-ink hover:border-petrol"}`}
          >
            {f.rotulo}
          </a>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-[var(--radius-app)] border border-line">
        <table className="w-full min-w-[820px] border-collapse text-[13px]">
          <thead>
            <tr className="bg-paper-raised text-left font-mono text-[10.5px] tracking-wide text-ink-muted uppercase">
              <th className="p-3">Dica</th>
              <th className="p-3">Tema</th>
              <th className="p-3">Origem</th>
              <th className="p-3 text-right">Vistas</th>
              <th className="p-3 text-right">Guardou</th>
              <th className="p-3 text-right">Já faz</th>
              <th className="p-3 text-right">Não é p/ mim</th>
              <th className="p-3">Situação</th>
            </tr>
          </thead>
          <tbody>
            {dicas.map((d) => {
              const v = nVistas.get(d.id) ?? 0;
              const naoParaMim = conta(d.id, "NAO_E_PARA_MIM");
              return (
                <tr key={d.id} className="border-t border-line align-top">
                  <td className="max-w-[360px] p-3">
                    <p className="font-semibold text-ink">{d.titulo}</p>
                    <p className="mt-0.5 text-[12px] leading-[1.5] text-ink-muted">{d.texto}</p>
                    <p className="mt-0.5 text-[12px] text-ink-muted italic">Tente hoje: {d.tenteHoje}</p>
                  </td>
                  <td className="p-3 text-ink-muted">{nomeDaCategoria(d.categoria)}</td>
                  <td className="p-3 text-ink-muted">{d.origem === "IA" ? `IA (lote ${d.lote})` : "Manual"}</td>
                  <td className="p-3 text-right tabular-nums">{v}</td>
                  <td className="p-3 text-right tabular-nums">{conta(d.id, "GUARDADA")}</td>
                  <td className="p-3 text-right tabular-nums">{conta(d.id, "JA_FACO")}</td>
                  <td className="p-3 text-right tabular-nums">
                    {naoParaMim}
                    {v > 0 ? <span className="text-ink-muted"> ({Math.round((naoParaMim / v) * 100)}%)</span> : null}
                  </td>
                  <td className="p-3">
                    <form action={alternarStatusDica.bind(null, d.id)}>
                      <SubmitButton
                        pendingText="..."
                        className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
                          d.status === "ATIVA"
                            ? "border-line text-petrol hover:border-petrol"
                            : "border-line bg-line text-ink-muted hover:text-petrol"
                        }`}
                      >
                        {d.status === "ATIVA" ? "Ativa · aposentar" : "Aposentada · reativar"}
                      </SubmitButton>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {dicas.length === 0 ? (
        <p className="mt-4 text-[13.5px] text-ink-muted">
          O banco ainda está vazio. As 60 dicas iniciais entram sozinhas na primeira vez que alguém marca presença.
        </p>
      ) : null}
    </div>
  );
}
