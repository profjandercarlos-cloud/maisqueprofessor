import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { AppNavLinks } from "@/components/app-nav-links";
import { getNavContext } from "@/lib/auth/require-active-access";

// Uma única família pra tudo (títulos, corpo e rótulos), igual ao
// quiz-mais-que-professor — trocado a pedido do usuário, alinhando o app ao
// padrão visual mais recente do quiz em vez do Fraunces + Plus Jakarta Sans
// usado antes (ver memória "reference-quiz-design-system"). --font-serif,
// --font-sans e --font-mono em globals.css apontam todos pra esta mesma
// variável, então nenhuma classe Tailwind precisou mudar nos componentes.
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Rota Além da Sala",
  description:
    "Responda ao diagnóstico, receba cinco possibilidades profissionais e transforme a escolhida em um plano personalizado de transição. Uma solução Mais Que Professor.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#081828",
};

// Sem preferência salva ainda (primeiro login) → escuro, sempre — não olha
// mais o prefers-color-scheme do sistema. Pedido explícito do usuário: só
// muda se a pessoa trocar manualmente pelo ThemeToggle (que aí sim grava em
// localStorage e passa a valer em todo login seguinte).
const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme',s||'dark');}catch(e){}})();`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const navContext = await getNavContext();

  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${dmSans.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-paper font-sans text-ink">
        {navContext ? (
          <>
            <AppNavLinks isAdmin={navContext.isAdmin} variant="sidebar" />
            <AppNavLinks isAdmin={navContext.isAdmin} variant="mobile" />
          </>
        ) : null}
        {/* xl:pl reserva o espaço da sidebar fixa (left-10 + w-60 = 280px,
            já incluindo o cartão com padding próprio, + uma folga) — sem
            isso, o conteúdo só ficava livre da sidebar por sorte, quando a
            tela era larga o bastante pra sobrar margem nos dois lados da
            coluna centralizada. Em telas de notebook (perto de 1280px, o
            começo do breakpoint xl), a margem não era suficiente e o
            conteúdo entrava por baixo da sidebar. */}
        <div
          className={
            navContext
              ? "flex flex-1 flex-col pb-16 xl:pb-0 xl:pl-[312px]"
              : "flex flex-1 flex-col"
          }
        >
          {children}
        </div>
      </body>
    </html>
  );
}
