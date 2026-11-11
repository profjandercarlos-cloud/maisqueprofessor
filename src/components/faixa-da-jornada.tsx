import { PASSOS_DA_JORNADA, type PassoDaJornada } from "@/lib/plano/jornada";

const TITULOS: Record<PassoDaJornada, string> = {
  diagnostico: "Diagnóstico",
  negocios: "Negócios",
  planos: "Plano",
  execucao: "Execução",
};

// "Passo 2 de 4": os mesmos quatro nomes do mapa do Painel (Diagnóstico, Negócios, Plano, Execução),
// no alto das telas da jornada, para a pessoa sempre saber onde está e o que vem depois.
export function FaixaDaJornada({ atual }: { atual: PassoDaJornada }) {
  const posicao = PASSOS_DA_JORNADA.indexOf(atual);
  return (
    <nav aria-label="Etapas do app" className="mb-7">
      <p className="mb-2 font-mono text-[10.5px] tracking-[0.06em] text-ink-muted uppercase">
        Passo {posicao + 1} de {PASSOS_DA_JORNADA.length} · <span className="text-gold">{TITULOS[atual]}</span>
      </p>
      <ol className="flex gap-1.5">
        {PASSOS_DA_JORNADA.map((passo, i) => (
          <li key={passo} className="flex-1" aria-current={i === posicao ? "step" : undefined}>
            <span
              className={`block h-1.5 rounded-full ${i < posicao ? "bg-petrol" : i === posicao ? "bg-gold" : "bg-line"}`}
              aria-hidden
            />
            <span
              className={`mt-1 block text-[11.5px] ${i === posicao ? "font-semibold text-ink" : "text-ink-muted"}`}
            >
              {TITULOS[passo]}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
