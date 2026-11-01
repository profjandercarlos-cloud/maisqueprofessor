// Alvo da geração automática de lotes de dicas (ver src/lib/dicas/trigger-lote.ts). Só o próprio
// app chama esta rota, autenticada por segredo compartilhado, no mesmo padrão de
// /api/internal/generation-step: responde rápido (202) e faz o trabalho pesado via after(), com
// orçamento de tempo próprio.
import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { timingSafeStringEqual } from "@/lib/timing-safe-equal";
import { gerarNovoLote } from "@/lib/dicas/banco";

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
  after(() => gerarNovoLote());
  return NextResponse.json({ accepted: true }, { status: 202 });
}
