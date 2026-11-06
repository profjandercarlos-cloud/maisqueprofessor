// Banco de dicas no banco de dados: carga inicial e geração automática de lotes novos.
import { db } from "@/lib/db";
import { logDebugError } from "@/lib/debug-error-log";
import { DICAS_INICIAIS } from "./iniciais";
import { diferencasDoBancoInicial } from "./sincronizar";
import { ESPERA_APOS_FALHA_MS, LOTE_TRAVADO_APOS_MS, TETO_DE_LOTES } from "./escolher";
import { filtrarDicasGeradas, gerarLoteDeDicas } from "./gerar-lote";

// O arquivo das dicas iniciais é a fonte da verdade das dicas MANUAIS. Na primeira presença depois
// de um deploy, grava as que faltam e atualiza o texto das que foram reescritas (pela `chave`).
// Idempotente e barato: uma leitura das ~60 dicas manuais, comparada em memória.
export async function garantirBancoInicial(): Promise<void> {
  const gravadas = await db.dica.findMany({
    where: { origem: "MANUAL" },
    select: { chave: true, categoria: true, titulo: true, texto: true, tenteHoje: true, ideia: true },
  });
  const { novas, mudadas } = diferencasDoBancoInicial(DICAS_INICIAIS, gravadas);

  if (novas.length > 0) {
    await db.dica.createMany({
      data: novas.map((d) => ({
        chave: d.chave,
        categoria: d.categoria,
        titulo: d.titulo,
        texto: d.texto,
        tenteHoje: d.tenteHoje,
        ideia: d.ideia ?? null,
        origem: "MANUAL" as const,
        lote: 0,
      })),
      skipDuplicates: true,
    });
  }
  // Reescrever o texto não mexe em reações nem em presenças: elas apontam para o id da dica.
  await Promise.all(
    mudadas.map((d) =>
      db.dica.update({
        where: { chave: d.chave },
        data: { categoria: d.categoria, titulo: d.titulo, texto: d.texto, tenteHoje: d.tenteHoje, ideia: d.ideia ?? null },
      }),
    ),
  );
}

// Situação dos lotes automáticos, para decidir se vale gerar mais um.
export async function situacaoDosLotes(agora = new Date()) {
  const [concluidos, emAndamento, falhouHaPouco] = await Promise.all([
    db.dicaLote.count({ where: { status: "CONCLUIDO" } }),
    db.dicaLote.count({
      where: { status: "EM_ANDAMENTO", createdAt: { gt: new Date(agora.getTime() - LOTE_TRAVADO_APOS_MS) } },
    }),
    db.dicaLote.count({
      where: { status: "FALHOU", createdAt: { gt: new Date(agora.getTime() - ESPERA_APOS_FALHA_MS) } },
    }),
  ]);
  return {
    lotesAutomaticosConcluidos: concluidos,
    emAndamento: emAndamento > 0,
    falhouHaPouco: falhouHaPouco > 0,
  };
}

export type ResultadoDoLote = { status: "gerado" | "ignorado" | "falhou"; quantidade?: number; motivo?: string };

// Gera e grava um lote novo. Chamado em segundo plano (rota interna) quando o banco está
// acabando para alguém. Dois lotes ao mesmo tempo seriam inofensivos (as repetidas são
// descartadas), mas mesmo assim há uma checagem simples para não gastar à toa.
export async function gerarNovoLote(agora = new Date()): Promise<ResultadoDoLote> {
  const s = await situacaoDosLotes(agora);
  if (s.emAndamento) return { status: "ignorado", motivo: "já há um lote em andamento" };
  if (s.falhouHaPouco) return { status: "ignorado", motivo: "um lote falhou há pouco" };
  if (s.lotesAutomaticosConcluidos >= TETO_DE_LOTES) return { status: "ignorado", motivo: "teto de lotes atingido" };

  const lote = await db.dicaLote.create({ data: {} });
  try {
    const existentes = await db.dica.findMany({ select: { categoria: true, titulo: true, texto: true } });

    // Sinais agregados e anônimos do que as pessoas guardam e dispensam, para o próximo lote
    // acertar mais. Só títulos de dicas, nunca nada de uma pessoa.
    const [guardadas, dispensadas] = await Promise.all(
      (["GUARDADA", "NAO_E_PARA_MIM"] as const).map(async (tipo) => {
        const grupos = await db.dicaReacao.groupBy({
          by: ["dicaId"],
          where: { tipo },
          _count: { _all: true },
          orderBy: { _count: { dicaId: "desc" } },
          take: 8,
        });
        if (grupos.length === 0) return [] as string[];
        const dicas = await db.dica.findMany({
          where: { id: { in: grupos.map((g) => g.dicaId) } },
          select: { titulo: true },
        });
        return dicas.map((d) => d.titulo);
      }),
    );

    const geradas = await gerarLoteDeDicas({
      existentes: existentes.map((e) => ({ categoria: e.categoria, titulo: e.titulo })),
      maisGuardadas: guardadas,
      maisDispensadas: dispensadas,
    });
    const { aprovadas, recusadas } = filtrarDicasGeradas(
      geradas,
      existentes.map((e) => ({ titulo: e.titulo, texto: e.texto })),
    );
    if (aprovadas.length === 0) throw new Error(`Nenhuma dica aprovada (${recusadas.length} recusadas).`);

    await db.dica.createMany({
      data: aprovadas.map((d, i) => ({
        chave: `ia-${lote.id}-${i + 1}`,
        categoria: d.categoria,
        titulo: d.titulo,
        texto: d.texto,
        tenteHoje: d.tenteHoje,
        ideia: d.ideia,
        origem: "IA" as const,
        lote: lote.id,
      })),
      skipDuplicates: true,
    });
    await db.dicaLote.update({
      where: { id: lote.id },
      data: { status: "CONCLUIDO", quantidade: aprovadas.length, finishedAt: new Date() },
    });
    return { status: "gerado", quantidade: aprovadas.length };
  } catch (err) {
    console.error("Erro ao gerar lote de dicas", err);
    await logDebugError("dicas:gerarNovoLote", err);
    await db.dicaLote.update({
      where: { id: lote.id },
      data: { status: "FALHOU", erro: err instanceof Error ? err.message.slice(0, 1000) : String(err), finishedAt: new Date() },
    });
    return { status: "falhou", motivo: err instanceof Error ? err.message : String(err) };
  }
}
