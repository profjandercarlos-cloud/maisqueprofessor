import type { ReactNode } from "react";

// Ícones da ficha do professor. Mesmo traço do menu do app (viewBox 18x18,
// linha fina, pontas arredondadas); herdam a cor do texto (currentColor).
function Icone({ children, className = "h-[18px] w-[18px]" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} shrink-0`}
      aria-hidden
    >
      {children}
    </svg>
  );
}

type P = { className?: string };

export const PessoasIcon = (p: P) => (
  <Icone {...p}>
    <circle cx="7" cy="6.5" r="2.5" />
    <path d="M2.5 15c0-2.5 2-4.2 4.5-4.2s4.5 1.7 4.5 4.2" />
    <circle cx="13" cy="7" r="2" />
    <path d="M12.5 10.8c2 .1 3.5 1.5 3.5 3.7" />
  </Icone>
);

export const CapelaIcon = (p: P) => (
  <Icone {...p}>
    <path d="M9 3L1.5 6.8 9 10.6l7.5-3.8L9 3z" />
    <path d="M4.5 8.6v3.4c0 1 2 2.2 4.5 2.2s4.5-1.2 4.5-2.2V8.6" />
    <path d="M16.5 6.8v4" />
  </Icone>
);

export const NumerosIcon = (p: P) => (
  <Icone {...p}>
    <rect x="2.5" y="9" width="3" height="6" rx=".8" />
    <rect x="7.5" y="3.5" width="3" height="11.5" rx=".8" />
    <rect x="12.5" y="6.5" width="3" height="8.5" rx=".8" />
  </Icone>
);

export const MoedaIcon = (p: P) => (
  <Icone {...p}>
    <circle cx="9" cy="9" r="6.5" />
    <path d="M11 6.8c-.4-.7-1.2-1.1-2-1.1-1.2 0-2 .6-2 1.5 0 2.2 4.2 1.1 4.2 3.3 0 .9-.9 1.6-2.2 1.6-.9 0-1.7-.4-2.1-1.1" />
    <path d="M9 4.3v1.4M9 12.3v1.4" />
  </Icone>
);

export const LivroIcon = (p: P) => (
  <Icone {...p}>
    <path d="M3 3.5h4.5A1.5 1.5 0 019 5v10a1.2 1.2 0 00-1.2-1.2H3z" />
    <path d="M15 3.5h-4.5A1.5 1.5 0 009 5v10a1.2 1.2 0 011.2-1.2H15z" />
  </Icone>
);

export const BandeiraIcon = (p: P) => (
  <Icone {...p}>
    <path d="M4 15.5V3" />
    <path d="M4 3.8h8.5l-1.6 3 1.6 3H4" />
  </Icone>
);

export const CrescerIcon = (p: P) => (
  <Icone {...p}>
    <path d="M2 13.5l4.5-4.5 3 3 6-6.5" />
    <path d="M11.5 5.5h4v4" />
  </Icone>
);

export const EscudoIcon = (p: P) => (
  <Icone {...p}>
    <path d="M9 2l6 2.2v4.6c0 3.4-2.4 5.9-6 7.2-3.6-1.3-6-3.8-6-7.2V4.2L9 2z" />
    <path d="M6.3 9l2 2 3.6-3.8" />
  </Icone>
);

export const RelogioIcon = (p: P) => (
  <Icone {...p}>
    <circle cx="9" cy="9" r="6.5" />
    <path d="M9 5.2V9l2.5 1.6" />
  </Icone>
);

export const CarteiraIcon = (p: P) => (
  <Icone {...p}>
    <rect x="2" y="4.5" width="14" height="10" rx="2" />
    <path d="M2 7.5h14" />
    <circle cx="12.5" cy="11" r=".9" />
  </Icone>
);

export const ClienteIcon = (p: P) => (
  <Icone {...p}>
    <circle cx="7.5" cy="6" r="2.6" />
    <path d="M2.5 15c0-2.7 2.2-4.5 5-4.5" />
    <path d="M10.5 12.5l2 2 3.5-4" />
  </Icone>
);
