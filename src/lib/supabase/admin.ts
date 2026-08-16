import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente com a chave secreta — ignora RLS, uso restrito a rotas de servidor
// que não têm sessão de usuário (ex.: webhook da Hotmart criando conta nova).
// Nunca importar isto em código que roda no browser.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
