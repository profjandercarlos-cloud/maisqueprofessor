// Regras puras do banco de dicas: qual dica a pessoa recebe hoje, quando o banco precisa de um
// lote novo e quando uma dica deve ser aposentada. Sem banco de dados aqui, para testar.

// Quando faltarem tantas dicas inéditas para alguém, o app pede à IA um novo lote. A geração leva
// cerca de um minuto, então o gatilho vem antes de a pessoa ficar sem dica.
export const LIMIAR_NOVO_LOTE = 10;
export const TAMANHO_DO_LOTE = 30;
// Teto de lotes automáticos (12 × 30 = 360 dicas): limita o gasto e o tamanho do banco.
export const TETO_DE_LOTES = 12;
// Depois de uma falha, espera antes de tentar de novo, para não gastar em loop.
export const ESPERA_APOS_FALHA_MS = 60 * 60 * 1000;
// Um lote "em andamento" há mais que isso é considerado travado e deixa de bloquear outro.
export const LOTE_TRAVADO_APOS_MS = 15 * 60 * 1000;

// Uma dica muito dispensada sai do sorteio sozinha (o admin pode reativar).
export const MIN_VISTAS_PARA_APOSENTAR = 20;
export const TAXA_DISPENSA_PARA_APOSENTAR = 0.6;

export type DicaSorteavel = { id: string; categoria: string };

export function dicasNovas(ativas: DicaSorteavel[], recebidas: ReadonlySet<string>): DicaSorteavel[] {
  return ativas.filter((d) => !recebidas.has(d.id));
}

// Temas que a pessoa mais guarda ganham mais chance; temas que ela mais dispensa, menos.
// Nunca chega a zero: ela ainda pode se surpreender.
export function pesoDaCategoria(guardadas: number, dispensadas: number): number {
  return Math.max(0.25, 1 + 0.5 * guardadas - 0.25 * dispensadas);
}

export type EscolhaDeDica = { dicaId: string; tipo: "nova" | "revisita" };

export function escolherDica(entrada: {
  ativas: DicaSorteavel[];
  /** Tudo o que a pessoa já recebeu, com o último dia em que viu cada dica. */
  recebidas: { dicaId: string; dia: string }[];
  /** Dicas que ela guardou. */
  guardadas: ReadonlySet<string>;
  guardadasPorCategoria: Record<string, number>;
  dispensadasPorCategoria: Record<string, number>;
  /** 0 a 1, injetável para os testes. */
  sorteio?: number;
}): EscolhaDeDica | null {
  const jaRecebidas = new Set(entrada.recebidas.map((r) => r.dicaId));
  const novas = dicasNovas(entrada.ativas, jaRecebidas);
  const sorteio = entrada.sorteio ?? Math.random();

  if (novas.length > 0) {
    const pesos = novas.map((d) =>
      pesoDaCategoria(entrada.guardadasPorCategoria[d.categoria] ?? 0, entrada.dispensadasPorCategoria[d.categoria] ?? 0),
    );
    const soma = pesos.reduce((a, b) => a + b, 0);
    let alvo = Math.min(sorteio, 0.999999) * soma;
    for (let i = 0; i < novas.length; i++) {
      alvo -= pesos[i];
      if (alvo < 0) return { dicaId: novas[i].id, tipo: "nova" };
    }
    return { dicaId: novas[novas.length - 1].id, tipo: "nova" };
  }

  // O banco acabou para esta pessoa: revisita a que ela viu há mais tempo, dando
  // preferência às que ela guardou ("Você guardou esta dica, que tal rever?").
  const ultimoDia = new Map<string, string>();
  for (const r of entrada.recebidas) {
    const atual = ultimoDia.get(r.dicaId);
    if (!atual || r.dia > atual) ultimoDia.set(r.dicaId, r.dia);
  }
  const candidatas = [...ultimoDia.entries()];
  if (candidatas.length === 0) return null;
  const guardadas = candidatas.filter(([id]) => entrada.guardadas.has(id));
  const grupo = guardadas.length > 0 ? guardadas : candidatas;
  grupo.sort((a, b) => (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : a[0].localeCompare(b[0])));
  return { dicaId: grupo[0][0], tipo: "revisita" };
}

export function precisaNovoLote(entrada: {
  restantes: number;
  lotesAutomaticosConcluidos: number;
  /** Já existe um lote sendo gerado (não travado). */
  emAndamento: boolean;
  /** Um lote falhou há pouco. */
  falhouHaPouco: boolean;
}): boolean {
  if (entrada.restantes > LIMIAR_NOVO_LOTE) return false;
  if (entrada.lotesAutomaticosConcluidos >= TETO_DE_LOTES) return false;
  if (entrada.emAndamento || entrada.falhouHaPouco) return false;
  return true;
}

export function deveAposentar(entrada: { vistas: number; dispensadas: number }): boolean {
  if (entrada.vistas < MIN_VISTAS_PARA_APOSENTAR) return false;
  return entrada.dispensadas / entrada.vistas >= TAXA_DISPENSA_PARA_APOSENTAR;
}
