// Conferência do diagnóstico antes de gerar os negócios: o resumo "o que entendemos de você".
// O resumo fica guardado junto das respostas (chave _revisao) com a assinatura do texto que a IA
// leu. Se a pessoa corrigir uma resposta, a assinatura muda e o resumo é refeito; se só recarregar a
// página, o resumo guardado volta na hora, sem nova chamada de IA.
import { createHash } from "node:crypto";
import type { Diagnostic, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { formatDiagnosticInput } from "@/lib/ai-engine/format-diagnostic-input";
import { resumirDiagnosticoOpenAI, type ResumoDaRevisao } from "@/lib/ai-engine/revisao-diagnostico-openai";
import { getStepsForRoute } from "./steps";

type RevisaoSalva = { assinatura: string; resumo: ResumoDaRevisao };

export type { ResumoDaRevisao };

export function assinaturaDoTexto(texto: string): string {
  return createHash("sha256").update(texto).digest("hex");
}

// null = não foi possível montar o resumo agora (a página segue sem ele; os avisos por regra e o botão
// de gerar continuam funcionando).
export async function obterRevisao(diagnostic: Diagnostic): Promise<ResumoDaRevisao | null> {
  const entrada = formatDiagnosticInput(diagnostic);
  const assinatura = assinaturaDoTexto(entrada);
  const answers = (diagnostic.answers ?? {}) as Record<string, unknown>;

  const salva = answers._revisao as RevisaoSalva | undefined;
  if (salva && salva.assinatura === assinatura && salva.resumo) return salva.resumo;

  try {
    const slugsAbertos = getStepsForRoute(diagnostic.rotaProfissional)
      .filter((s) => s.type === "textarea" || s.type === "situation")
      .map((s) => s.slug);
    const resumo = await resumirDiagnosticoOpenAI(entrada, slugsAbertos);
    const nova: RevisaoSalva = { assinatura, resumo };
    await db.diagnostic.update({
      where: { id: diagnostic.id },
      data: { answers: { ...answers, _revisao: nova } as unknown as Prisma.InputJsonValue },
    });
    return resumo;
  } catch (err) {
    console.error("Falha ao montar a conferência do diagnóstico", err);
    return null;
  }
}
