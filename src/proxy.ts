import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rotas de API (webhooks, etc.) ficam de fora do redirecionamento de login —
// cada uma valida sua própria autenticação (ex.: hottok da Hotmart), e um
// consumidor externo não deve receber uma página HTML de login como resposta.
const PUBLIC_PATHS = [
  "/login",
  "/esqueci-senha",
  "/definir-senha",
  "/auth",
  "/api",
  "/conta-excluida",
  "/acesso-expirado",
  "/bem-vindo",
];

// A checagem de acesso revogado/expirado NÃO roda aqui de propósito — este
// arquivo é executado num runtime que não suporta os módulos nativos do
// Node usados pelo driver do Postgres (import de "@/lib/db" aqui derrubava
// toda requisição em produção na Vercel). Essa checagem vive em
// requireActiveAccess() (src/lib/auth/require-active-access.ts), chamada
// dentro de cada página protegida — lá roda em runtime Node.js normal.

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() (não getSession()) — revalida o token contra o servidor da
  // Supabase em vez de confiar cegamente no cookie.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));

  // Sem usuário normalmente significa "não logado" ou "sessão inválida" —
  // redireciona, como sempre. A única exceção: erro claramente de SERVIDOR
  // (5xx) do lado da Supabase, que pode acontecer sob carga (ex.: cada poll
  // da tela de espera de geração chamando getUser() muitas vezes seguidas).
  // Não é o mesmo caso de "sem sessão nenhuma" (AuthSessionMissingError,
  // status 400 — visitante nunca logado, deve continuar redirecionando
  // normalmente) nem de token realmente inválido/expirado (401/403) — só
  // 5xx é passado adiante, confiando em requireActiveAccess()/requireUser()
  // (runtime Node normal, roda de novo na página) pra decidir de verdade.
  const erroDeServidor = typeof error?.status === "number" && error.status >= 500;
  if (!user && !isPublicPath) {
    if (erroDeServidor) {
      console.error("proxy: getUser() falhou com erro de servidor — deixando passar", error);
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  // icon/apple-icon: rotas de ícone geradas pelo Next (src/app/icon.tsx e
  // apple-icon.tsx) — sem isso, o favicon vira um redirect pra /login pra
  // quem não está logado, e a imagem também não carregaria no e-mail de
  // convite do Supabase (que referencia a URL pública dessas rotas).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
