import { db } from "@/lib/db";
import type { Diagnostic } from "@/generated/prisma/client";

// Retorna o diagnóstico em andamento pra continuar, cria um novo só quando a
// pessoa nunca começou nenhum, e devolve null quando o mais recente já está
// CONCLUIDO — nesse caso o chamador deve redirecionar pra /diagnostico/concluido
// em vez de criar um diagnóstico paralelo por baixo.
//
// Sem essa checagem, visitar qualquer /diagnostico/{slug} (ex.: botão voltar
// do navegador, aba antiga, link salvo) depois de já ter concluído o
// diagnóstico e gerado possibilidades criava silenciosamente um SEGUNDO
// diagnóstico EM_ANDAMENTO — que, por ser mais recente, passava a ser o que
// a Home mostra, fazendo a pessoa parecer ter perdido todo o progresso
// (possibilidades e plano já gerados a partir do diagnóstico concluído
// continuavam existindo, só ficavam "escondidos" atrás do diagnóstico novo).
export async function getOrCreateActiveDiagnostic(userId: string): Promise<Diagnostic | null> {
  const mostRecent = await db.diagnostic.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (mostRecent?.status === "EM_ANDAMENTO") return mostRecent;
  if (mostRecent?.status === "CONCLUIDO") return null;

  return db.diagnostic.create({
    data: {
      userId,
      intention: "NAO_SEI",
      answers: {},
    },
  });
}
