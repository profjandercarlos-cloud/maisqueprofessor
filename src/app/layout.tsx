import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import { AppNavLinks } from "@/components/app-nav-links";
import { getNavContext } from "@/lib/auth/require-active-access";

// Sem `weight` fixo em nenhuma das duas — ambas são fontes variáveis, e
// travar num array de pesos estáticos (como estava antes na Fraunces)
// impede o navegador de pedir qualquer peso fora dessa lista, deixando os
// títulos sempre mais "finos" do que poderiam ficar. Mesma configuração do
// Professor Sem Susto (outro app da mesma casa), pra manter a tipografia
// igual entre os dois.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
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
      className={`${fraunces.variable} ${plusJakartaSans.variable} ${spaceMono.variable} h-full antialiased`}
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
