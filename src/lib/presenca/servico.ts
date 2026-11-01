// Lista de presença no banco de dados: marcar presença (que escolhe a dica e a mensagem do dia),
// ler o estado de hoje e registrar as reações às dicas.
import { Prisma, type DicaReacaoTipo } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { garantirBancoInicial, situacaoDosLotes } from "@/lib/dicas/banco";
import { deveAposentar, dicasNovas, escolherDica, precisaNovoLote } from "@/lib/dicas/escolher";
import { dataParaDia, diaLocal, diaParaData, situacaoDePresenca, type SituacaoDePresenca } from "./dias";
import { escolherMensagem, mensagemPorId, preencherMensagem } from "./escolher-mensagem";

export async function diasDePresenca(userId: string): Promise<string[]> {
  const linhas = await db.presenca.findMany({ where: { userId }, select: { dia: true }, orderBy: { dia: "asc" } });
  return linhas.map((l) => dataParaDia(l.dia));
}

export type ResultadoDaPresenca = { jaTinha: boolean; precisaLote: boolean };

// Registra o "Presente" de hoje. O dia só conta aqui, no clique: abrir o app sem passar pela
// chamada não conta. Escolhe a dica do dia (uma que a pessoa ainda não recebeu) e, em momentos
// especiais, a mensagem de incentivo, e guarda os dois para a tela poder reexibir.
export async function marcarPresenca(
  userId: string,
  opcoes: { nome: string | null; proximaAcao: string | null },
  agora = new Date(),
): Promise<ResultadoDaPresenca> {
  const hoje = diaLocal(agora);
  const diaHoje = diaParaData(hoje);

  const existente = await db.presenca.findUnique({ where: { userId_dia: { userId, dia: diaHoje } }, select: { id: true } });
  if (existente) return { jaTinha: true, precisaLote: false };

  await garantirBancoInicial();

  const [anteriores, ativas, reacoes] = await Promise.all([
    db.presenca.findMany({
      where: { userId, dia: { lt: diaHoje } },
      select: { dia: true, dicaId: true, mensagemId: true },
      orderBy: { dia: "asc" },
    }),
    db.dica.findMany({ where: { status: "ATIVA" }, select: { id: true, categoria: true } }),
    db.dicaReacao.findMany({ where: { userId }, select: { tipo: true, dicaId: true, dica: { select: { categoria: true } } } }),
  ]);

  const guardadasPorCategoria: Record<string, number> = {};
  const dispensadasPorCategoria: Record<string, number> = {};
  const guardadas = new Set<string>();
  for (const r of reacoes) {
    if (r.tipo === "GUARDADA") {
      guardadas.add(r.dicaId);
      guardadasPorCategoria[r.dica.categoria] = (guardadasPorCategoria[r.dica.categoria] ?? 0) + 1;
    } else if (r.tipo === "NAO_E_PARA_MIM") {
      dispensadasPorCategoria[r.dica.categoria] = (dispensadasPorCategoria[r.dica.categoria] ?? 0) + 1;
    }
  }

  const recebidas = anteriores.filter((p) => p.dicaId).map((p) => ({ dicaId: p.dicaId as string, dia: dataParaDia(p.dia) }));
  const escolha = escolherDica({ ativas, recebidas, guardadas, guardadasPorCategoria, dispensadasPorCategoria });

  const situacao = situacaoDePresenca(anteriores.map((p) => dataParaDia(p.dia)), hoje);
  const mensagem = escolherMensagem(situacao, {
    nome: opcoes.nome,
    proxima: opcoes.proximaAcao,
    anteriorId: anteriores[anteriores.length - 1]?.mensagemId ?? null,
  });

  try {
    await db.presenca.create({
      data: { userId, dia: diaHoje, dicaId: escolha?.dicaId ?? null, mensagemId: mensagem?.id ?? null },
    });
  } catch (err) {
    // Dois cliques ao mesmo tempo: o segundo bate na chave única e simplesmente não cria outro dia.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { jaTinha: true, precisaLote: false };
    }
    throw err;
  }

  // O banco está acabando para esta pessoa? Então o chamador dispara um lote novo em segundo plano.
  const jaVistas = new Set(recebidas.map((r) => r.dicaId));
  if (escolha) jaVistas.add(escolha.dicaId);
  const restantes = dicasNovas(ativas, jaVistas).length;
  const precisaLote = precisaNovoLote({ restantes, ...(await situacaoDosLotes(agora)) });

  return { jaTinha: false, precisaLote };
}

export type EstadoDeHoje = {
  hoje: string;
  presente: boolean;
  total: number;
  situacao: SituacaoDePresenca | null;
  mensagem: string | null;
  dica: {
    id: string;
    categoria: string;
    titulo: string;
    texto: string;
    tenteHoje: string;
    ideia: string | null;
    revisita: boolean;
    reacao: DicaReacaoTipo | null;
  } | null;
};

// O que mostrar depois do "Presente": contador, mensagem e dica de hoje (com a reação atual).
export async function estadoDeHoje(
  userId: string,
  opcoes: { nome: string | null; proximaAcao: string | null },
  agora = new Date(),
): Promise<EstadoDeHoje> {
  const hoje = diaLocal(agora);
  const dias = await diasDePresenca(userId);
  const presente = dias.includes(hoje);
  const total = dias.length;
  if (!presente) return { hoje, presente, total, situacao: null, mensagem: null, dica: null };

  const presenca = await db.presenca.findUnique({
    where: { userId_dia: { userId, dia: diaParaData(hoje) } },
    select: { dicaId: true, mensagemId: true },
  });
  const situacao = situacaoDePresenca(dias.filter((d) => d < hoje), hoje);

  const modelo = mensagemPorId(presenca?.mensagemId);
  const mensagem = modelo
    ? preencherMensagem(modelo.texto, {
        nome: opcoes.nome,
        dias: situacao.total,
        seguidos: situacao.seguidos,
        proxima: opcoes.proximaAcao,
      })
    : null;

  let dica: EstadoDeHoje["dica"] = null;
  if (presenca?.dicaId) {
    const [d, reacao, vezes] = await Promise.all([
      db.dica.findUnique({ where: { id: presenca.dicaId } }),
      db.dicaReacao.findUnique({ where: { userId_dicaId: { userId, dicaId: presenca.dicaId } }, select: { tipo: true } }),
      db.presenca.count({ where: { userId, dicaId: presenca.dicaId } }),
    ]);
    if (d) {
      dica = {
        id: d.id,
        categoria: d.categoria,
        titulo: d.titulo,
        texto: d.texto,
        tenteHoje: d.tenteHoje,
        ideia: d.ideia,
        revisita: vezes > 1,
        reacao: reacao?.tipo ?? null,
      };
    }
  }
  return { hoje, presente, total, situacao, mensagem, dica };
}

// Reação a uma dica. Clicar de novo na mesma reação a remove (volta para "sem resposta").
// Só reage a dicas que a pessoa já recebeu em algum dia.
export async function reagirADica(userId: string, dicaId: string, tipo: DicaReacaoTipo): Promise<void> {
  const recebeu = await db.presenca.count({ where: { userId, dicaId } });
  if (recebeu === 0) return;

  const atual = await db.dicaReacao.findUnique({ where: { userId_dicaId: { userId, dicaId } }, select: { tipo: true } });
  if (atual?.tipo === tipo) {
    await db.dicaReacao.delete({ where: { userId_dicaId: { userId, dicaId } } });
  } else {
    await db.dicaReacao.upsert({
      where: { userId_dicaId: { userId, dicaId } },
      create: { userId, dicaId, tipo },
      update: { tipo },
    });
  }
  await aposentarSeMuitoDispensada(dicaId);
}

// Muita gente dispensando a mesma dica: ela sai do sorteio sozinha (o admin pode reativar).
async function aposentarSeMuitoDispensada(dicaId: string): Promise<void> {
  const [vistas, dispensadas] = await Promise.all([
    db.presenca.count({ where: { dicaId } }),
    db.dicaReacao.count({ where: { dicaId, tipo: "NAO_E_PARA_MIM" } }),
  ]);
  if (deveAposentar({ vistas, dispensadas })) {
    await db.dica.updateMany({ where: { id: dicaId, status: "ATIVA" }, data: { status: "APOSENTADA" } });
  }
}

export async function salvarNotaDaDica(userId: string, dicaId: string, nota: string): Promise<void> {
  const limpa = nota.trim().slice(0, 1000);
  await db.dicaReacao.updateMany({
    where: { userId, dicaId, tipo: "GUARDADA" },
    data: { nota: limpa || null },
  });
}
