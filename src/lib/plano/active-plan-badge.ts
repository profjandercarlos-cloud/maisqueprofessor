import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import type { PossibilityRole } from "@/generated/prisma/client";

// Usado só pelo AppHeader, pra mostrar o ícone da possibilidade ativa +
// medalhas conquistadas em todo canto do app — nunca redireciona (o
// header aparece em várias páginas com regras de acesso diferentes), só
// devolve null quando não há sessão ou não há plano ativo.
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
      milestones: { select: { achievedAt: true } },
    },
  });
  if (!plan) return null;

  const achievedCount = plan.milestones.filter((m) => m.achievedAt).length;
  return { papel: plan.possibility.papel, achievedCount };
}
