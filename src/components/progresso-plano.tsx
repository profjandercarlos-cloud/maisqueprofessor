import { STATUS_ACAO_META, resumoDasAcoes, type StatusAcao } from "@/lib/plano/acoes";

type AcaoResumida = { sequencia: number; nome: string; status: StatusAcao };

// Barra segmentada do plano: UM segmento por ação, colorido pelo estado dela
// (cinza = a fazer, âmbar = em andamento, verde = concluída). Dá para saber onde a
// pessoa está só de bater o olho; a legenda e o "3 de 8" confirmam.
export function ProgressoPlano({
  acoes,
  mostrarLegenda = true,
}: {
  acoes: AcaoResumida[];
  mostrarLegenda?: boolean;
}) {
  const ordenadas = [...acoes].sort((a, b) => a.sequencia - b.sequencia);
  const resumo = resumoDasAcoes(ordenadas);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="font-serif text-[19px] font-medium tracking-tight text-petrol">
          {resumo.concluidas} de {resumo.total} {resumo.total === 1 ? "ação concluída" : "ações concluídas"}
        </p>
        <p className="font-mono text-[11px] tracking-wide text-ink-muted">{resumo.percentual}%</p>
      </div>

      <div
        className="flex gap-1"
        role="img"
        aria-label={`${resumo.concluidas} de ${resumo.total} ações concluídas, ${resumo.emAndamento} em andamento`}
      >
        {ordenadas.map((a) => {
          const meta = STATUS_ACAO_META[a.status];
          return (
            <span
              key={a.sequencia}
              title={`Ação ${a.sequencia}: ${a.nome} — ${meta.rotulo}`}
              className="h-2.5 flex-1 rounded-full"
              style={{ background: a.status === "A_FAZER" ? "var(--line)" : meta.cor }}
            />
          );
        })}
      </div>

      {mostrarLegenda ? (
        <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
          {(Object.keys(STATUS_ACAO_META) as StatusAcao[]).map((s) => (
            <li key={s} className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: s === "A_FAZER" ? "var(--ink-muted)" : STATUS_ACAO_META[s].cor, opacity: s === "A_FAZER" ? 0.5 : 1 }}
              />
              {STATUS_ACAO_META[s].rotulo}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

// Selo de estado (usado nas listas e no cabeçalho de cada ação).
export function SeloStatusAcao({ status }: { status: StatusAcao }) {
  const meta = STATUS_ACAO_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] font-mono text-[10px] font-semibold tracking-wide uppercase"
      style={{ color: meta.cor, background: meta.corFundo }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.cor }} />
      {meta.rotulo}
    </span>
  );
}
