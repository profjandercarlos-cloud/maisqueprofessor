import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

// Exportação de dados (LGPD) — tudo que a pessoa preencheu no produto.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: {
      diagnostics: {
        include: { rounds: { include: { possibilities: true } } },
      },
      plans: {
        include: {
          weeks: { include: { checkin: { include: { guidance: true } }, journalEntry: true } },
        },
      },
    },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "usuário não encontrado" }, { status: 404 });
  }

  const body = JSON.stringify(dbUser, null, 2);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="mais-que-professor-meus-dados.json"`,
    },
  });
}
