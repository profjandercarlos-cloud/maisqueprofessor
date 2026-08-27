import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import { AppNavLinks } from "@/components/app-nav-links";
import { getNavContext } from "@/lib/auth/require-active-access";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Mais Que Professor",
  description:
    "Descubra caminhos profissionais além da sala de aula, com um plano de execução semanal feito para você.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0b1420",
};

const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('theme');var t=s||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const navContext = await getNavContext();

  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} ${spaceMono.variable} h-full antialiased`}
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
        {/* xl:pl reserva o espaço da sidebar fixa (left-10 + w-52 = 248px, +
            uma folga) — sem isso, o conteúdo só ficava livre da sidebar por
            sorte, quando a tela era larga o bastante pra sobrar margem nos
            dois lados da coluna centralizada. Em telas de notebook (perto de
            1280px, o começo do breakpoint xl), a margem não era suficiente e
            o conteúdo entrava por baixo da sidebar. */}
        <div
          className={
            navContext
              ? "flex flex-1 flex-col pb-16 xl:pb-0 xl:pl-[272px]"
              : "flex flex-1 flex-col"
          }
        >
          {children}
        </div>
      </body>
    </html>
  );
}
