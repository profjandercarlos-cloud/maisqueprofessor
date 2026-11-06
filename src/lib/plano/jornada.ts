// "Você está aqui" do Painel (a função que o antigo Mapa tinha): em qual dos quatro
// passos da jornada a pessoa está: Diagnóstico → Negócios → Plano → Execução.
// Diagnóstico e favoritos são duas portas de entrada para o mesmo funil, então ter
// negócios (gerados OU favoritos) já conta o passo "Negócios" como feito, mesmo sem
// diagnóstico.
export type PassoDaJornada = "diagnostico" | "negocios" | "planos" | "execucao";
export type EstadoDoPasso = "feito" | "atual" | "pendente";

export const PASSOS_DA_JORNADA: PassoDaJornada[] = ["diagnostico", "negocios", "planos", "execucao"];

export type SituacaoDaJornada = {
  diagnosticoConcluido: boolean;
  negociosGerados: number;
  favoritos: number;
  /** Quantos planos a pessoa já criou (de qualquer origem). */
  planos: number;
  /** Quantos desses planos têm todas as ações concluídas. */
  planosConcluidos?: number;
};

// null = a jornada está completa: todos os planos criados foram concluídos.
export function passoAtualDaJornada(s: SituacaoDaJornada): PassoDaJornada | null {
  if (s.planos > 0) return (s.planosConcluidos ?? 0) < s.planos ? "execucao" : null;
  if (s.negociosGerados > 0 || s.favoritos > 0) return "planos";
  return s.diagnosticoConcluido ? "negocios" : "diagnostico";
}

export function estadosDaJornada(s: SituacaoDaJornada): Record<PassoDaJornada, EstadoDoPasso> {
  const atual = passoAtualDaJornada(s);
  const feitos: Record<PassoDaJornada, boolean> = {
    diagnostico: s.diagnosticoConcluido,
    negocios: s.negociosGerados > 0 || s.favoritos > 0,
    planos: s.planos > 0,
    execucao: s.planos > 0 && (s.planosConcluidos ?? 0) >= s.planos,
  };
  const estado = (p: PassoDaJornada): EstadoDoPasso => (feitos[p] ? "feito" : atual === p ? "atual" : "pendente");
  return {
    diagnostico: estado("diagnostico"),
    negocios: estado("negocios"),
    planos: estado("planos"),
    execucao: estado("execucao"),
  };
}
