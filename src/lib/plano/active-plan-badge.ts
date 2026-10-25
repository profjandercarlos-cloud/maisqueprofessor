import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import type { PossibilityRole } from "@/generated/prisma/client";

// Medalhas do cabeçalho: de 0 a 5, uma a cada quinto do plano concluído (ações
// concluídas ÷ total). Plano sem ações (formato antigo) cai nos marcos que ele tinha.
export function medalhasDoPlano(concluidas: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(5, Math.floor((concluidas / total) * 5));
}

// Usado só pelo AppHeader, pra mostrar o ícone do negócio ativo + medalhas
// conquistadas em todo canto do app — nunca redireciona (o header aparece em
// várias páginas com regras de acesso diferentes), só devolve null quando não há
// sessão ou não há plano ativo.
export async function loadActivePlanBadge(): Promise<{
  papel: PossibilityRole;
  achievedCount: number;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const plan = await db.plan.findFirst({
    where: { userId: user.id, status: "ATIVO" },
    select: {
      possibility: { select: { papel: true } },
      acoes: { select: { status: true } },
      milestones: { select: { achievedAt: true } },
    },
  });
  if (!plan) return null;

  const achievedCount =
    plan.acoes.length > 0
      ? medalhasDoPlano(plan.acoes.filter((a) => a.status === "CONCLUIDA").length, plan.acoes.length)
      : plan.milestones.filter((m) => m.achievedAt).length;
  return { papel: plan.possibility.papel, achievedCount };
}
