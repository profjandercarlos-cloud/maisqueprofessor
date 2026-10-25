// Regras puras do plano por ações: status de cada ação (derivado do checklist),
// resumo de progresso ("3 de 8") e as cores/rótulos de cada estado.
import { z } from "zod";

export type StatusAcao = "A_FAZER" | "EM_ANDAMENTO" | "CONCLUIDA";

// O status NUNCA é digitado pela pessoa: sai do checklist. Nenhum item marcado = a
// fazer; todos marcados = concluída; qualquer coisa no meio = em andamento.
export function statusDaAcao(itens: { feito: boolean }[]): StatusAcao {
  if (itens.length === 0) return "A_FAZER";
  const feitos = itens.filter((i) => i.feito).length;
  if (feitos === 0) return "A_FAZER";
  return feitos === itens.length ? "CONCLUIDA" : "EM_ANDAMENTO";
}

export type ResumoDoPlano = {
  total: number;
  concluidas: number;
  emAndamento: number;
  aFazer: number;
  /** 0 a 100, só das ações concluídas (o andamento parcial não conta). */
  percentual: number;
  /** A ação em andamento mais antiga ou, se não houver, a primeira a fazer. null = tudo concluído. */
  proxima: number | null;
};

export function resumoDasAcoes(acoes: { sequencia: number; status: StatusAcao }[]): ResumoDoPlano {
  const ordenadas = [...acoes].sort((a, b) => a.sequencia - b.sequencia);
  const concluidas = ordenadas.filter((a) => a.status === "CONCLUIDA").length;
  const emAndamento = ordenadas.filter((a) => a.status === "EM_ANDAMENTO").length;
  const proxima =
    ordenadas.find((a) => a.status === "EM_ANDAMENTO") ?? ordenadas.find((a) => a.status === "A_FAZER");
  return {
    total: ordenadas.length,
    concluidas,
    emAndamento,
    aFazer: ordenadas.length - concluidas - emAndamento,
    percentual: ordenadas.length === 0 ? 0 : Math.round((concluidas / ordenadas.length) * 100),
    proxima: proxima ? proxima.sequencia : null,
  };
}

// Cores dos três estados. Cinza = ainda não começou (neutro, nunca vermelho: não
// começar não é erro), âmbar = em andamento, verde = concluída. Valores fixos e
// legíveis nos temas claro e escuro.
export const STATUS_ACAO_META: Record<StatusAcao, { rotulo: string; cor: string; corFundo: string }> = {
  A_FAZER: { rotulo: "A fazer", cor: "#7b8794", corFundo: "rgba(123,135,148,0.16)" },
  EM_ANDAMENTO: { rotulo: "Em andamento", cor: "#d9930d", corFundo: "rgba(217,147,13,0.18)" },
  CONCLUIDA: { rotulo: "Concluída", cor: "#2f9e6e", corFundo: "rgba(47,158,110,0.18)" },
};

// Orientações de cada ação (coluna Json PlanAcao.orientacoes).
export const orientacoesSchema = z.object({
  comoFazer: z.array(z.string()),
  pontosDeAtencao: z.array(z.string()),
  errosComuns: z.array(z.string()),
});
export type OrientacoesDaAcao = z.infer<typeof orientacoesSchema>;

export function lerOrientacoes(valor: unknown): OrientacoesDaAcao | null {
  const r = orientacoesSchema.safeParse(valor);
  return r.success ? r.data : null;
}
