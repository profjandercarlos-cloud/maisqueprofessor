import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

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
];

// Continuam acessíveis mesmo com acesso expirado/revogado — a pessoa precisa
// conseguir ver o status e sair da conta mesmo sem acesso ativo.
const ACCESS_EXEMPT_PATHS = ["/configuracoes"];

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
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user && !isPublicPath) {
    const isExempt = ACCESS_EXEMPT_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));
    if (!isExempt) {
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { accessRevokedAt: true },
      });
      if (dbUser?.accessRevokedAt) {
        const url = request.nextUrl.clone();
        url.pathname = "/acesso-expirado";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
