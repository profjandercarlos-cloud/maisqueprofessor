// Alvo da auto-invocação da fila de geração V4 (ver
// src/lib/ai-engine/trigger-generation-step.ts). Só o próprio app chama
// esta rota — autenticada por segredo compartilhado, mesmo padrão do cron
// (src/app/api/cron/daily/route.ts). Responde rápido (202) e agenda o
// trabalho pesado via after(), pra essa fase ter seu próprio orçamento de
// tempo, sem depender de quem chamou continuar esperando a resposta.
import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { timingSafeStringEqual } from "@/lib/timing-safe-equal";
import { runGenerationStep } from "@/lib/ai-engine/run-generation-pipeline";

export const maxDuration = 120;

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

  after(() => runGenerationStep(roundId));

  return NextResponse.json({ accepted: true }, { status: 202 });
}
