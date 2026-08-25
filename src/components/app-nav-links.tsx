function InicioIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">
      <path d="M2.5 8.5 L9 3 L15.5 8.5" />
      <path d="M4 7.3 V15 H14 V7.3" />
    </svg>
  );
}

function PlanosIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">
      <rect x="3" y="2.5" width="12" height="13" rx="1.5" />
      <line x1="6" y1="6.5" x2="12" y2="6.5" />
      <line x1="6" y1="9" x2="12" y2="9" />
      <line x1="6" y1="11.5" x2="9.5" y2="11.5" />
    </svg>
  );
}

function AgendaIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">
      <rect x="2.5" y="3.5" width="13" height="12" rx="1.5" />
      <line x1="2.5" y1="7" x2="15.5" y2="7" />
      <line x1="5.5" y1="2" x2="5.5" y2="4.5" />
      <line x1="12.5" y1="2" x2="12.5" y2="4.5" />
    </svg>
  );
}

function EvolucaoIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">
      <circle cx="9" cy="7.2" r="4.2" />
      <path d="M6.3 10.9 L5.3 15.5 L9 13.3 L12.7 15.5 L11.7 10.9" />
    </svg>
  );
}

function ConfiguracoesIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">
      <line x1="3" y1="5" x2="15" y2="5" />
      <circle cx="10" cy="5" r="1.6" />
      <line x1="3" y1="9" x2="15" y2="9" />
      <circle cx="7" cy="9" r="1.6" />
      <line x1="3" y1="13" x2="15" y2="13" />
      <circle cx="12" cy="13" r="1.6" />
    </svg>
  );
}

function AdministracaoIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">
      <path d="M9 2.5l5.5 2v4c0 4-2.3 6.3-5.5 7.5-3.2-1.2-5.5-3.5-5.5-7.5v-4z" />
      <path d="M6.7 9l1.6 1.6L11.3 7" />
    </svg>
  );
}

const BASE_ITEMS = [
  { href: "/", label: "Início", Icon: InicioIcon },
  { href: "/planos", label: "Meus planos", Icon: PlanosIcon },
  { href: "/agenda", label: "Agenda", Icon: AgendaIcon },
  { href: "/evolucao", label: "Evolução", Icon: EvolucaoIcon },
  { href: "/configuracoes", label: "Configurações", Icon: ConfiguracoesIcon },
];

const ADMIN_ITEM = { href: "/admin", label: "Administração", Icon: AdministracaoIcon };

// No computador sobra espaço nas laterais da coluna central (max-w do
// conteúdo) — a partir de xl (1280px) isso é grande o suficiente pra fixar
// o menu no canto superior esquerdo sem sobrepor o conteúdo. Abaixo disso
// (tablet e celular) usa a lista horizontal simples no rodapé.
//
// A sidebar é renderizada uma única vez pelo layout raiz (variant
// "sidebar"), em toda página logada. A Home renderiza só a lista horizontal
// (variant "mobile") pra não duplicar a sidebar nela — nenhuma outra página
// tinha a lista horizontal antes, então elas não pedem essa variante.
export function AppNavLinks({
  isAdmin,
  variant,
}: {
  isAdmin: boolean;
  variant: "sidebar" | "mobile";
}) {
  const items = isAdmin ? [...BASE_ITEMS, ADMIN_ITEM] : BASE_ITEMS;

  if (variant === "mobile") {
    return (
      <div className="flex gap-5 text-[13.5px] font-semibold text-petrol xl:hidden">
        {items.map(({ href, label }) => (
          <a key={href} href={href} className="hover:underline">
            {label} →
          </a>
        ))}
      </div>
    );
  }

  return (
    <nav className="hidden xl:fixed xl:top-28 xl:left-10 xl:flex xl:w-44 xl:flex-col xl:gap-1">
      {items.map(({ href, label, Icon }) => (
        <a
          key={href}
          href={href}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-semibold text-petrol transition-colors hover:bg-gold-soft"
        >
          <Icon />
          {label}
        </a>
      ))}
    </nav>
  );
}
