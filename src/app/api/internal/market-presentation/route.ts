// Alvo da auto-invocação da camada de apresentação de mercado (ver
// src/lib/ai-engine/trigger-market-presentation-step.ts). Mesmo padrão de
// autenticação por segredo compartilhado das outras rotas internas
// (generation-step, cron). Camada aditiva: responde rápido e agenda o
// trabalho via after(), sem bloquear nada do round em si.
import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { timingSafeStringEqual } from "@/lib/timing-safe-equal";
import { runMarketPresentationStep } from "@/lib/ai-engine/run-market-presentation-step";

// 300s — teto do plano Vercel Pro (era 120, ajustado pro Hobby).
export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader !== null && timingSafeStringEqual(authHeader, `Bearer ${secret}`);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let roundId: string | undefined;
  try {
    const body = await request.json();
    roundId = typeof body?.roundId === "string" ? body.roundId : undefined;
  } catch {
    // corpo ausente/inválido — cai no 400 abaixo
  }
  if (!roundId) {
    return NextResponse.json({ error: "roundId ausente" }, { status: 400 });
  }

  after(() => runMarketPresentationStep(roundId));

  return NextResponse.json({ accepted: true }, { status: 202 });
}
