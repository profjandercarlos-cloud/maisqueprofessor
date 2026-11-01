import { Medal } from "@/components/medal";
import { LEVEL_LABELS, LEVEL_ORDER } from "@/lib/plano/evolucao";
import type { StatusAcao } from "@/lib/plano/acoes";

type AcaoComMarco = { sequencia: number; status: StatusAcao; marco: string | null };

// As 5 medalhas do plano (Bronze a Diamante). Cada uma é um marco que a IA definiu ao gerar o
// plano e que uma ação específica fecha: colorida quando a ação foi concluída, apagada antes.
// Planos criados antes dos marcos não têm o que mostrar aqui e a faixa some.
export function MedalhasDoPlano({ acoes }: { acoes: AcaoComMarco[] }) {
  const marcos = [...acoes].filter((a) => a.marco).sort((a, b) => a.sequencia - b.sequencia);
  if (marcos.length === 0) return null;

  const conquistados = marcos.filter((m) => m.status === "CONCLUIDA").length;

  return (
    <div>
      <p className="mb-3 text-[13px] text-ink-muted">
        <span className="font-semibold text-petrol">
          {conquistados} de {marcos.length} medalhas
        </span>{" "}
        {conquistados === marcos.length ? "conquistadas. Plano completo." : "conquistadas"}
      </p>
      <ol className="grid grid-cols-5 gap-2">
        {marcos.map((m, i) => {
          const nivel = LEVEL_ORDER[i + 1];
          const conquistada = m.status === "CONCLUIDA";
          return (
            <li
              key={m.sequencia}
              className="flex flex-col items-center gap-1.5 text-center"
              title={`${LEVEL_LABELS[nivel]}: ${m.marco} (ação ${m.sequencia})`}
            >
              <Medal level={conquistada ? nivel : "iniciando"} size={38} />
              <span
                className={`text-[11px] leading-[1.25] font-medium ${conquistada ? "text-ink" : "text-ink-muted"}`}
              >
                {m.marco}
              </span>
              <span className="font-mono text-[9px] tracking-wide text-ink-muted uppercase">{LEVEL_LABELS[nivel]}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
