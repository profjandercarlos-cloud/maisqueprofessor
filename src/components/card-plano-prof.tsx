import { AppLogoMark } from "@/components/app-logo-mark";
import { NOME_PLANO_PAGO, PRECO_PLANO_PAGO } from "@/lib/hotmart/oferta";
import { PLANOS_DOS_FAVORITOS_DISPONIVEIS, PLANOS_POR_CONTA } from "@/lib/negocios/favoritos";

// Cores fixas, de propósito: o card é um convite do produto e precisa contrastar
// com os cards claros nos dois temas (no tema escuro, a borda e o brilho do topo
// é que o separam do fundo).
const COR = {
  fundoA: "#071f2f",
  fundoB: "#0b3042",
  destaque: "#33c2d4",
  texto: "#f2f6f5",
  suave: "#a9bcc6",
  linha: "rgba(255,255,255,0.12)",
} as const;

function Check() {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      stroke={COR.destaque}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-[3px] h-[18px] w-[18px] shrink-0"
      aria-hidden
    >
      <circle cx="9" cy="9" r="6.8" strokeOpacity=".4" />
      <path d="M6 9.2l2 2 4-4.4" />
    </svg>
  );
}

// O que a pessoa recebe. A linha dos 5 negócios só aparece quando o gerador de
// plano por negócio existir (PLANOS_DOS_FAVORITOS_DISPONIVEIS): até lá, o card
// só promete o que o produto já entrega.
function entregaveis(): { titulo: string; texto: string }[] {
  return [
    PLANOS_DOS_FAVORITOS_DISPONIVEIS
      ? {
          titulo: `Teste até ${PLANOS_POR_CONTA} ideias de negócios`,
          texto: "Escolha entre os seus favoritos e receba um plano de execução para cada um.",
        }
      : {
          titulo: "Questionário que indica o que combina com você",
          texto: "Em vez de adivinhar, você descobre quais caminhos fazem mais sentido para o seu momento.",
        },
    {
      titulo: "Plano de execução com checklist",
      texto: "As ações essenciais, na ordem certa, cada uma com checklist, orientações e os erros mais comuns.",
    },
    {
      titulo: "Seu progresso à vista",
      texto: "Você vê quantas ações já concluiu e qual é a próxima, no seu ritmo.",
    },
    {
      titulo: "Apoio contra a procrastinação",
      texto: "Para o momento em que você trava e a ideia começa a ficar para depois.",
    },
  ];
}

export function CardPlanoProf({ linkCompra }: { linkCompra: string | null }) {
  return (
    <section
      className="relative mt-6 overflow-hidden rounded-[var(--radius-app)] p-6 sm:p-8"
      style={{
        background: `linear-gradient(145deg, ${COR.fundoA} 0%, ${COR.fundoB} 100%)`,
        border: `1px solid rgba(51,194,212,0.35)`,
        boxShadow: "0 18px 40px -22px rgba(7,31,47,0.55)",
        color: COR.texto,
      }}
    >
      {/* Fio de luz no topo: o único ornamento do card. */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${COR.destaque}, transparent)` }}
        aria-hidden
      />

      <div className="mb-5 flex items-center gap-2.5">
        <AppLogoMark />
        <p className="font-mono text-[11px] font-semibold tracking-[0.14em] uppercase" style={{ color: COR.destaque }}>
          RAS · {NOME_PLANO_PAGO}
        </p>
      </div>

      <h2 className="mb-4 max-w-[22ch] font-serif text-[clamp(26px,5vw,34px)] leading-[1.12] font-medium tracking-tight">
        Esta ideia pode virar realidade. Ou ficar só mais uma ideia.
      </h2>

      <div className="mb-6 flex max-w-[60ch] flex-col gap-3 text-[15px] leading-[1.65]" style={{ color: COR.suave }}>
        <p>Você acabou de ver como este negócio funciona, quanto custa começar e por onde dar o primeiro passo.</p>
        <p>
          Ideias assim costumam se perder no &ldquo;depois eu vejo isso&rdquo;: a semana aperta, a rotina engole o tempo
          e a oportunidade vai ficando para trás.
        </p>
        <p style={{ color: COR.texto }}>
          O RAS foi feito para isso não acontecer com você. Não é mais conteúdo para ler. É uma estrutura para você{" "}
          <strong className="font-semibold" style={{ color: COR.destaque }}>
            executar
          </strong>
          .
        </p>
      </div>

      <div className="mb-6 h-px" style={{ background: COR.linha }} aria-hidden />

      <p className="mb-4 font-mono text-[11px] tracking-[0.14em] uppercase" style={{ color: COR.suave }}>
        O que você recebe
      </p>
      <ul className="mb-7 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        {entregaveis().map((e) => (
          <li key={e.titulo} className="flex gap-2.5">
            <Check />
            <div>
              <p className="text-[14.5px] font-semibold">{e.titulo}</p>
              <p className="mt-0.5 text-[13.5px] leading-[1.55]" style={{ color: COR.suave }}>
                {e.texto}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mb-6 h-px" style={{ background: COR.linha }} aria-hidden />

      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="font-serif text-[30px] leading-none font-medium tracking-tight">
            {PRECO_PLANO_PAGO.parcelado}
          </p>
          <p className="mt-1.5 text-[13px]" style={{ color: COR.suave }}>
            ou {PRECO_PLANO_PAGO.aVista} à vista · {PRECO_PLANO_PAGO.duracao}
          </p>
        </div>
        {linkCompra ? (
          <a
            href={linkCompra}
            className="rounded-lg px-6 py-3 text-[15px] font-semibold transition-opacity hover:opacity-90"
            style={{ background: COR.destaque, color: "#04202c" }}
          >
            Quero começar a executar →
          </a>
        ) : null}
      </div>

      <p className="mt-5 text-[12.5px] leading-[1.55]" style={{ color: COR.suave }}>
        O RAS não promete renda: entrega método e acompanhamento para você colocar em prática.
      </p>
    </section>
  );
}
