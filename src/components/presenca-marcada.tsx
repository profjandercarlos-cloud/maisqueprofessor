import { DicaCard } from "@/components/dica-card";
import type { EstadoDeHoje } from "@/lib/presenca/servico";

// Depois do "Presente": o contador sobe, uma mensagem de incentivo (só em momentos especiais),
// a dica do dia com as reações e o caminho para o app.
export function PresencaMarcada({ estado, nome }: { estado: EstadoDeHoje; nome: string | null }) {
  const primeiro = nome?.split(/\s+/)[0] ?? null;
  return (
    <div>
      <span className="mb-[18px] inline-block rounded-full bg-badge-bg px-2.5 py-[5px] font-mono text-[11px] tracking-[0.12em] text-badge-text uppercase">
        Presença registrada
      </span>

      <div className="mb-6 flex items-end gap-4">
        <p className="font-serif text-[clamp(52px,12vw,76px)] leading-none font-medium tracking-tight text-petrol tabular-nums">
          {estado.total}
        </p>
        <div className="pb-2">
          <p className="font-serif text-[20px] leading-tight font-medium text-ink">
            {estado.total === 1 ? "dia" : "dias"} com você
          </p>
          <p className="text-[13px] text-ink-muted">{primeiro ? `Presente, ${primeiro}.` : "Presente."}</p>
        </div>
      </div>

      {estado.mensagem ? (
        <p className="mb-6 max-w-[56ch] rounded-lg border border-line bg-paper-raised px-4 py-3 text-[15px] leading-[1.6] text-ink">
          {estado.mensagem}
        </p>
      ) : null}

      {estado.dica ? (
        <div className="mb-7">
          <DicaCard dica={estado.dica} voltar="/?presente=1" />
        </div>
      ) : null}

      <a
        href="/"
        className="inline-block rounded-lg bg-gold px-6 py-3 text-[15px] font-semibold text-paper transition-colors hover:opacity-90"
      >
        Ir para o app →
      </a>
      <a href="/lista-de-presenca" className="ml-5 text-[13px] font-semibold text-petrol hover:underline">
        Ver a lista de presença
      </a>
    </div>
  );
}
