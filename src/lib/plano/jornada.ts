// "Você está aqui" do Painel (a função que o antigo Mapa tinha): em qual dos três
// passos da jornada a pessoa está. Diagnóstico e favoritos são duas portas de
// entrada para o mesmo funil, então ter negócios (gerados OU favoritos) já conta
// o passo "Negócios" como feito, mesmo sem diagnóstico.
export type PassoDaJornada = "diagnostico" | "negocios" | "planos";
export type EstadoDoPasso = "feito" | "atual" | "pendente";

export type SituacaoDaJornada = {
  diagnosticoConcluido: boolean;
  negociosGerados: number;
  favoritos: number;
  planos: number;
};

// null = já há plano: o Painel mostra o plano ativo no topo e nenhum passo "atual".
export function passoAtualDaJornada(s: SituacaoDaJornada): PassoDaJornada | null {
  if (s.planos > 0) return null;
  if (s.negociosGerados > 0 || s.favoritos > 0) return "planos";
  return s.diagnosticoConcluido ? "negocios" : "diagnostico";
}

export function estadosDaJornada(s: SituacaoDaJornada): Record<PassoDaJornada, EstadoDoPasso> {
  const atual = passoAtualDaJornada(s);
  const feitos: Record<PassoDaJornada, boolean> = {
    diagnostico: s.diagnosticoConcluido,
    negocios: s.negociosGerados > 0 || s.favoritos > 0,
    planos: s.planos > 0,
  };
  const estado = (p: PassoDaJornada): EstadoDoPasso => (feitos[p] ? "feito" : atual === p ? "atual" : "pendente");
  return { diagnostico: estado("diagnostico"), negocios: estado("negocios"), planos: estado("planos") };
}
