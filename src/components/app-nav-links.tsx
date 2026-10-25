"use client";

import { usePathname } from "next/navigation";
import { AppLogoMark } from "@/components/app-logo-mark";
import { AREAS_TRANCADAS } from "@/lib/acesso-areas";

function PainelIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">
      <path d="M2.5 8.5 L9 3 L15.5 8.5" />
      <path d="M4 7.3 V15 H14 V7.3" />
    </svg>
  );
}

function PossibilidadesIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">
      <circle cx="9" cy="3.3" r="1.4" />
      <circle cx="3.3" cy="14.7" r="1.4" />
      <circle cx="9" cy="14.7" r="1.4" />
      <circle cx="14.7" cy="14.7" r="1.4" />
      <path d="M9 4.7 V9 M9 9 L3.3 13.3 M9 9 V13.3 M9 9 L14.7 13.3" />
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

function AntiProcrastinacaoIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">
      <circle cx="9" cy="9" r="6.5" />
      <circle cx="9" cy="9" r="3.2" />
      <circle cx="9" cy="9" r="0.6" fill="currentColor" stroke="none" />
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

function NegociosIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">
      <path d="M2.5 7l1-3.5h11l1 3.5" />
      <path d="M3 7v7.5h12V7" />
      <path d="M2.5 7a2.2 2.2 0 004.4 0 2.2 2.2 0 004.4 0 2.2 2.2 0 004.2 0" />
    </svg>
  );
}

function CadeadoIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={`${className} shrink-0`} aria-hidden>
      <rect x="3.5" y="8" width="11" height="7" rx="1.6" />
      <path d="M6 8V5.8a3 3 0 016 0V8" />
    </svg>
  );
}

const NEGOCIOS_ITEM = { href: "/negocios", label: "Ideias de negócios", Icon: NegociosIcon };

const BASE_ITEMS = [
  { href: "/", label: "Painel", Icon: PainelIcon },
  { href: "/diagnostico/concluido", label: "Meus negócios", Icon: PossibilidadesIcon },
  { href: "/planos", label: "Planos de execução", Icon: PlanosIcon },
  { href: "/anti-procrastinacao", label: "Antiprocrastinação", Icon: AntiProcrastinacaoIcon },
  { href: "/configuracoes", label: "Configurações", Icon: ConfiguracoesIcon },
];

const ADMIN_ITEM = { href: "/admin", label: "Administração", Icon: AdministracaoIcon };

function isActiveHref(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  // "Possibilidades" cobre toda a árvore /diagnostico (wizard, incremento,
  // ajuste, tela das 5 possibilidades) — não só o /diagnostico/concluido
  // exato pro qual o item aponta.
  if (href.startsWith("/diagnostico")) return pathname.startsWith("/diagnostico");
  return pathname === href || pathname.startsWith(`${href}/`);
}

// No computador sobra espaço nas laterais da coluna central (max-w do
// conteúdo) — a partir de xl (1280px) isso é grande o suficiente pra fixar
// o menu no canto superior esquerdo sem sobrepor o conteúdo. Abaixo disso
// (tablet e celular), onde não sobra espaço lateral nenhum, vira uma barra
// fixa no rodapé só com ícones — o padrão comum de app em tela pequena,
// sempre acessível sem precisar rolar a página.
//
// As duas variantes são renderizadas uma única vez pelo layout raiz, em
// toda página logada — cada uma se esconde via CSS (hidden/xl:hidden) no
// breakpoint que não é seu, então nenhuma página precisa pedir isso de
// novo individualmente.
export function AppNavLinks({
  isAdmin,
  pago,
  variant,
}: {
  isAdmin: boolean;
  pago: boolean;
  variant: "sidebar" | "mobile";
}) {
  const pathname = usePathname();

  // Conta gratuita: Pequenos Negócios primeiro e liberado; as áreas do
  // produto continuam no menu, com cadeado, apontando pra página de compra.
  // Conta paga: tudo liberado, com Pequenos Negócios logo depois de Possibilidades.
  const base = pago
    ? [...BASE_ITEMS.slice(0, 3), NEGOCIOS_ITEM, ...BASE_ITEMS.slice(3)]
    : [NEGOCIOS_ITEM, ...BASE_ITEMS];
  const items = (isAdmin ? [...base, ADMIN_ITEM] : base).map((item) => {
    const trancado = !pago && item.href in AREAS_TRANCADAS;
    return {
      ...item,
      trancado,
      destino: trancado ? `/area-bloqueada?de=${encodeURIComponent(item.href)}` : item.href,
    };
  });

  if (variant === "mobile") {
    return (
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-line bg-paper xl:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {items.map(({ href, label, Icon, trancado, destino }) => {
          const active = !trancado && isActiveHref(pathname, href);
          return (
            <a
              key={href}
              href={destino}
              aria-label={trancado ? `${label} (Plano Prof+)` : label}
              aria-current={active ? "page" : undefined}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
              style={{ color: active ? "var(--petrol)" : "var(--ink-muted)", opacity: trancado ? 0.6 : 1 }}
            >
              <Icon />
              {trancado ? (
                <CadeadoIcon className="h-2.5 w-2.5" />
              ) : (
                <span
                  className="h-1 w-1 rounded-full"
                  style={{ background: active ? "var(--gold)" : "transparent" }}
                />
              )}
            </a>
          );
        })}
      </nav>
    );
  }

  // Variante "sidebar" (computador) — envolvida num cartão com fundo
  // próprio (bg-paper-raised, o mesmo token usado nos cards de conteúdo em
  // toda a página) pra se diferenciar do fundo da coluna central, em vez de
  // flutuar sem contorno sobre o mesmo bg-paper do body inteiro. A marca no
  // topo do cartão substitui a que aparecia no AppHeader em telas grandes
  // (escondida via xl:hidden lá, pra não duplicar).
  return (
    <nav className="hidden xl:fixed xl:top-8 xl:left-10 xl:flex xl:w-60 xl:flex-col xl:gap-1 xl:rounded-2xl xl:border xl:border-line xl:bg-paper-raised xl:p-4 xl:shadow-[var(--shadow)]">
      <a href="/" className="mb-3 flex items-center gap-2.5 px-1">
        <AppLogoMark />
        <span className="flex flex-col leading-tight">
          <span className="font-serif text-[15px] font-semibold tracking-tight text-petrol">
            Renda Além da Sala
          </span>
          <span className="text-[10.5px] text-ink-muted">Crie seu negócio a partir das suas habilidades.</span>
        </span>
      </a>
      {items.map(({ href, label, Icon, trancado, destino }) => {
        const active = !trancado && isActiveHref(pathname, href);
        return (
          <a
            key={href}
            href={destino}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors ${
              active ? "bg-gold-soft text-petrol" : "text-petrol hover:bg-gold-soft"
            } ${trancado ? "opacity-60" : ""}`}
          >
            <Icon />
            {label}
            {trancado ? <CadeadoIcon className="ml-auto h-3.5 w-3.5" /> : null}
          </a>
        );
      })}
    </nav>
  );
}
