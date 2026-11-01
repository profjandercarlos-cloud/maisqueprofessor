// Dados da pessoa que a chamada e as mensagens usam: o nome e a próxima ação do plano ativo.
import { db } from "@/lib/db";
import { resumoDasAcoes } from "@/lib/plano/acoes";

// Nome do cookie que lembra que a pessoa escolheu "Só passei por aqui" hoje (guarda o dia).
export const COOKIE_ADIOU_PRESENCA = "ras_adiou";

export type ContextoDaPessoa = {
  nome: string | null;
  plano: { id: string; titulo: string } | null;
  proximaAcao: string | null;
};

export async function contextoDaPessoa(userId: string): Promise<ContextoDaPessoa> {
  const [usuario, plano] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { name: true } }),
    db.plan.findFirst({
      where: { userId, status: "ATIVO" },
      select: {
        id: true,
        possibility: { select: { titulo: true } },
        acoes: { orderBy: { sequencia: "asc" }, select: { sequencia: true, nome: true, status: true } },
      },
    }),
  ]);

  const resumo = plano ? resumoDasAcoes(plano.acoes) : null;
  const proxima = plano && resumo?.proxima != null ? plano.acoes.find((a) => a.sequencia === resumo.proxima) : undefined;

  return {
    nome: usuario?.name?.trim() || null,
    plano: plano ? { id: plano.id, titulo: plano.possibility.titulo } : null,
    proximaAcao: proxima ? proxima.nome : null,
  };
}

// Só aceita caminhos internos do app (evita redirecionar para fora por um parâmetro adulterado).
export function caminhoSeguro(valor: string, padrao = "/"): string {
  return valor.startsWith("/") && !valor.startsWith("//") && !valor.includes("\\") ? valor : padrao;
}
