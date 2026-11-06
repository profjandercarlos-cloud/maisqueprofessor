import { PASSOS_DA_JORNADA, type EstadoDoPasso, type PassoDaJornada } from "@/lib/plano/jornada";

const TITULOS: Record<PassoDaJornada, string> = {
  diagnostico: "Diagnóstico",
  negocios: "Negócios",
  planos: "Plano",
  execucao: "Execução",
};

type Props = {
  estados: Record<PassoDaJornada, EstadoDoPasso>;
  /** Linhas curtas sob cada parada (ex.: "5 personalizados", "2 favoritos"). */
  resumos: Record<PassoDaJornada, string[]>;
  /** Para onde cada parada leva ao ser clicada. */
  destinos: Record<PassoDaJornada, string>;
  /** O que fazer agora, quando há um próximo passo a indicar. */
  proximo: { texto: string; links: { href: string; texto: string }[] } | null;
};

// O caminho da pessoa como um mapa: quatro paradas numa trilha, as já percorridas
// preenchidas, a de agora marcada com "Você está aqui" e as seguintes ainda vazias.
export function MapaDaJornada({ estados, resumos, destinos, proximo }: Props) {
  return (
    <div>
      <ol className="grid grid-cols-4">
        {PASSOS_DA_JORNADA.map((passo, i) => {
          const estado = estados[passo];
          const anterior = i > 0 ? estados[PASSOS_DA_JORNADA[i - 1]] : null;
          const feito = estado === "feito";
          const atual = estado === "atual";
          return (
            <li key={passo} aria-current={atual ? "step" : undefined}>
              <a href={destinos[passo]} className="group flex flex-col items-center px-0.5 text-center">
                {/* Espaço reservado para o marcador, para as quatro paradas ficarem alinhadas. */}
                <span className="flex h-8 items-end justify-center pb-1.5">
                  {atual ? (
                    <span className="relative rounded-full bg-gold px-2 py-[2px] font-mono text-[9px] font-semibold tracking-[0.06em] whitespace-nowrap text-paper uppercase">
                      Você está aqui
                      <span
                        className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-gold"
                        aria-hidden
                      />
                    </span>
                  ) : null}
                </span>

                <span className="relative flex h-10 w-full items-center justify-center">
                  {i > 0 ? (
                    <span
                      className={`absolute top-1/2 left-0 h-[3px] w-1/2 -translate-y-1/2 ${anterior === "feito" ? "bg-petrol" : "bg-line"}`}
                      aria-hidden
                    />
                  ) : null}
                  {i < PASSOS_DA_JORNADA.length - 1 ? (
                    <span
                      className={`absolute top-1/2 right-0 h-[3px] w-1/2 -translate-y-1/2 ${feito ? "bg-petrol" : "bg-line"}`}
                      aria-hidden
                    />
                  ) : null}
                  {atual ? (
                    <span className="absolute h-10 w-10 rounded-full bg-gold opacity-30 motion-safe:animate-ping" aria-hidden />
                  ) : null}
                  <span
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 font-mono text-[12px] font-semibold transition-colors ${
                      feito
                        ? "border-petrol bg-petrol text-paper"
                        : atual
                          ? "border-gold bg-gold-soft text-petrol"
                          : "border-line bg-paper-raised text-ink-muted group-hover:border-petrol"
                    }`}
                  >
                    {feito ? "✓" : i + 1}
                  </span>
                </span>

                <span
                  className={`mt-2 font-serif text-[14.5px] leading-tight font-medium group-hover:underline ${
                    estado === "pendente" ? "text-ink-muted" : "text-ink"
                  }`}
                >
                  {TITULOS[passo]}
                </span>
                {resumos[passo].map((linha) => (
                  <span key={linha} className="mt-0.5 text-[11.5px] leading-[1.35] text-ink-muted">
                    {linha}
                  </span>
                ))}
              </a>
            </li>
          );
        })}
      </ol>

      {proximo ? (
        <div className="mt-5 rounded-lg bg-gold-soft px-4 py-3">
          <p className="text-[13.5px] leading-[1.55] text-ink">{proximo.texto}</p>
          {proximo.links.length > 0 ? (
            <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
              {proximo.links.map((l) => (
                <a key={l.href} href={l.href} className="text-[13px] font-semibold text-petrol hover:underline">
                  {l.texto} →
                </a>
              ))}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
