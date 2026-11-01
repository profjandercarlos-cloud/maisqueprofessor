import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

// Total de dias de presença da pessoa logada, para o selo "Dia N" do cabeçalho. Nunca
// redireciona nem falha a página (o cabeçalho aparece em telas com regras de acesso diferentes):
// sem sessão ou com qualquer erro, devolve 0 e o selo simplesmente não aparece.
export async function carregarTotalDePresencas(): Promise<number> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 0;
    return await db.presenca.count({ where: { userId: user.id } });
  } catch {
    return 0;
  }
}
