import type { NextConfig } from "next";

// Origem do Supabase — o cliente do navegador (login, logout, redefinição de
// senha) fala direto com a API de auth do Supabase, então precisa estar
// liberada em connect-src. Vem da própria env var pública já usada pelo app.
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// CSP conservadora: mantém 'unsafe-inline' em script-src porque o Next.js
// injeta o payload de hidratação como <script> inline no HTML (sem isso a
// aplicação inteira quebra) — uma versão baseada em nonce por requisição
// resolveria isso com mais rigor, mas exige instrumentar src/proxy.ts com
// cuidado extra e não faz parte desta correção. Mesmo com essa concessão,
// frame-ancestors/object-src/base-uri já bloqueiam os vetores mais comuns
// (clickjacking, plugins, injeção de <base>).
//
// Em desenvolvimento (`next dev`), o React usa eval() para depuração e o
// Turbopack conversa com o navegador por WebSocket (HMR) — sem liberar
// 'unsafe-eval' e o próprio host por ws:, a página local quebra (React
// trava, HMR nunca conecta). Nenhum dos dois existe no build de produção,
// então essa liberação fica restrita a NODE_ENV=development.
const isDev = process.env.NODE_ENV === "development";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""}${isDev ? " ws://localhost:* wss://localhost:*" : ""}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
