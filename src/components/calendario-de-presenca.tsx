import { DIAS_DA_SEMANA, NOMES_DOS_MESES, chaveDoMes, mesVizinho, montarMes } from "@/lib/presenca/calendario";

// Calendário do mês só com os dias em que a pessoa disse "Presente". Dia sem presença fica em
// branco: nada de vermelho nem de "faltou". As setas navegam pelos meses (parâmetro `mes` na URL).
export function CalendarioDePresenca({
  ano,
  mes,
  presentes,
  hoje,
  caminho,
  parametros = {},
}: {
  ano: number;
  mes: number;
  presentes: Set<string>;
  hoje: string;
  /** Página que mostra o calendário; as setas voltam para ela com ?mes=AAAA-MM. */
  caminho: string;
  /** Outros parâmetros da URL a preservar nas setas (ex.: a aba aberta). */
  parametros?: Record<string, string>;
}) {
  const semanas = montarMes(ano, mes, presentes, hoje);
  const anterior = mesVizinho(ano, mes, -1);
  const seguinte = mesVizinho(ano, mes, 1);
  const mesDeHoje = hoje.slice(0, 7);

  const link = (m: { ano: number; mes: number }) => {
    const q = new URLSearchParams({ ...parametros, mes: chaveDoMes(m.ano, m.mes) });
    return `${caminho}?${q.toString()}`;
  };
  const noMes = [...presentes].filter((d) => d.startsWith(chaveDoMes(ano, mes))).length;

  return (
    <section aria-label={`Presenças de ${NOMES_DOS_MESES[mes - 1]} de ${ano}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <a
          href={link(anterior)}
          aria-label="Mês anterior"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-petrol transition-colors hover:border-petrol"
        >
          ‹
        </a>
        <div className="text-center">
          <p className="font-serif text-[17px] font-medium text-petrol capitalize">
            {NOMES_DOS_MESES[mes - 1]} de {ano}
          </p>
          <p className="text-[12px] text-ink-muted">
            {noMes === 0 ? "Nenhuma presença neste mês" : noMes === 1 ? "1 presença neste mês" : `${noMes} presenças neste mês`}
          </p>
        </div>
        <a
          href={link(seguinte)}
          aria-label="Próximo mês"
          className={`flex h-8 w-8 items-center justify-center rounded-full border border-line text-petrol transition-colors hover:border-petrol ${
            chaveDoMes(ano, mes) >= mesDeHoje ? "pointer-events-none opacity-30" : ""
          }`}
        >
          ›
        </a>
      </div>

      <div className="grid grid-cols-7 gap-y-1.5 text-center">
        {DIAS_DA_SEMANA.map((d, i) => (
          <span key={i} className="pb-1 font-mono text-[10.5px] text-ink-muted">
            {d}
          </span>
        ))}
        {semanas.flat().map((c, i) =>
          c === null ? (
            <span key={i} />
          ) : (
            <span key={c.dia} className="flex items-center justify-center">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] tabular-nums ${
                  c.presente
                    ? "bg-petrol font-semibold text-paper"
                    : c.hoje
                      ? "border-2 border-gold font-semibold text-petrol"
                      : c.futuro
                        ? "text-ink-muted opacity-40"
                        : "text-ink-muted"
                }`}
                aria-label={c.presente ? `Dia ${c.numero}: presente` : c.hoje ? `Hoje, dia ${c.numero}` : undefined}
              >
                {c.numero}
              </span>
            </span>
          ),
        )}
      </div>
    </section>
  );
}
