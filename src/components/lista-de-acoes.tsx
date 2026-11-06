import { SeloStatusAcao } from "@/components/progresso-plano";
import { STATUS_ACAO_META, type StatusAcao } from "@/lib/plano/acoes";
import { LEVEL_LABELS, LEVEL_ORDER } from "@/lib/plano/evolucao";

type AcaoDaLista = {
  id: string;
  sequencia: number;
  nome: string;
  objetivo: string;
  status: StatusAcao;
  marco: string | null;
  itens: { feito: boolean }[];
};

// Todas as ações do plano, na ordem, com o estado de cada uma e a ação de agora em destaque.
// `resumida` é a versão enxuta do Painel (uma linha por ação); a completa fica na página do plano.
export function ListaDeAcoes({
  planId,
  acoes,
  atual,
  resumida = false,
}: {
  planId: string;
  acoes: AcaoDaLista[];
  /** Número (sequência) da ação em foco agora; null quando o plano está concluído. */
  atual: number | null;
  resumida?: boolean;
}) {
  const ordenadas = [...acoes].sort((a, b) => a.sequencia - b.sequencia);
  const marcos = ordenadas.filter((a) => a.marco);
  const medalha = (sequencia: number) => {
    const i = marcos.findIndex((a) => a.sequencia === sequencia);
    return i >= 0 ? LEVEL_LABELS[LEVEL_ORDER[i + 1]] : null;
  };

  return (
    <ol className={`flex flex-col ${resumida ? "gap-1.5" : "gap-2.5"}`}>
      {ordenadas.map((acao) => {
        const meta = STATUS_ACAO_META[acao.status];
        const feitos = acao.itens.filter((i) => i.feito).length;
        const emFoco = acao.sequencia === atual;
        const href = `/planos/${planId}/acoes/${acao.id}`;

        if (resumida) {
          return (
            <li key={acao.id}>
              <a
                href={href}
                aria-current={emFoco ? "step" : undefined}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:border-petrol ${
                  emFoco ? "border-gold bg-gold-soft" : "border-line bg-paper"
                }`}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-semibold"
                  style={{ background: meta.corFundo, color: meta.cor }}
                >
                  {acao.status === "CONCLUIDA" ? "✓" : acao.sequencia}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-ink">{acao.nome}</span>
                  <span className="block text-[11.5px] text-ink-muted">
                    {feitos} de {acao.itens.length} passos
                    {acao.marco ? ` · medalha ${medalha(acao.sequencia)}` : ""}
                  </span>
                </span>
                {emFoco ? (
                  <span className="shrink-0 rounded-full bg-gold px-2 py-[1px] font-mono text-[9px] font-semibold tracking-[0.06em] text-paper uppercase">
                    Agora
                  </span>
                ) : (
                  <span className="shrink-0 font-mono text-[10px] tracking-wide uppercase" style={{ color: meta.cor }}>
                    {meta.rotulo}
                  </span>
                )}
              </a>
            </li>
          );
        }

        return (
          <li key={acao.id}>
            <a
              href={href}
              aria-current={emFoco ? "step" : undefined}
              className={`flex items-start gap-3.5 rounded-[var(--radius-app)] border p-4 transition-colors hover:border-petrol ${
                emFoco ? "border-2 border-gold bg-gold-soft" : "border-line bg-paper-raised"
              }`}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-[13px] font-semibold"
                style={{ background: meta.corFundo, color: meta.cor }}
              >
                {acao.status === "CONCLUIDA" ? "✓" : acao.sequencia}
              </span>
              <span className="min-w-0 flex-1">
                <span className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-serif text-[17px] font-medium text-ink">{acao.nome}</span>
                  <SeloStatusAcao status={acao.status} />
                  {emFoco ? (
                    <span className="rounded-full bg-gold px-2 py-[1px] font-mono text-[9px] font-semibold tracking-[0.06em] text-paper uppercase">
                      Você está aqui
                    </span>
                  ) : null}
                </span>
                {acao.marco ? (
                  <span className="mb-1 inline-block rounded-full bg-gold-soft px-2 py-[2px] text-[11px] font-semibold text-petrol">
                    Medalha {medalha(acao.sequencia)}: {acao.marco}
                  </span>
                ) : null}
                <span className="block text-[13.5px] leading-[1.5] text-ink-muted">{acao.objetivo}</span>
                <span className="mt-1.5 block text-[12px] text-ink-muted">
                  {feitos} de {acao.itens.length} passos feitos
                </span>
              </span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}
