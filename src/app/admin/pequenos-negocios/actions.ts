"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-active-access";
import { logDebugError } from "@/lib/debug-error-log";
import { reescreverIdeiaOpenAI } from "@/lib/ai-engine/ideias-openai";
import {
  conteudoDoOriginal,
  lerConteudo,
  negocioOriginalSchema,
  type ConteudoIdeia,
} from "@/lib/ideias/conteudo";
import { ORDENS_DO_TESTE, prepararImportacao } from "@/lib/ideias/importar";
import type { CaminhoRendaStatus, Prisma } from "@/generated/prisma/client";

const comErro = (returnTo: string, msg: string): never =>
  redirect(`${returnTo}?error=${encodeURIComponent(msg)}`);
const comMsg = (returnTo: string, msg: string): never =>
  redirect(`${returnTo}?msg=${encodeURIComponent(msg)}`);

function atualizarTelas(returnTo: string, slug?: string) {
  revalidatePath("/admin/pequenos-negocios");
  revalidatePath(returnTo);
  revalidatePath("/negocios");
  if (slug) revalidatePath(`/negocios/${slug}`);
}

const json = (v: unknown) => v as Prisma.InputJsonValue;

// Aprovar / deixar pendente / rejeitar. A observação digitada vira a nota de
// revisão (motivo) ao deixar pendente ou rejeitar; ao aprovar, a nota é limpa.
export async function revisarIdeia(
  returnTo: string,
  id: string,
  novoStatus: CaminhoRendaStatus,
  formData: FormData,
) {
  await requireAdmin();
  const nota = String(formData.get("observacao") ?? "").trim();

  const ideia = await db.ideiaNegocio.update({
    where: { id },
    data: { status: novoStatus, notaRevisao: novoStatus === "APROVADO" ? null : nota || null },
    select: { slug: true },
  });

  atualizarTelas(returnTo, ideia.slug);
  redirect(returnTo);
}

// Ajustar: a IA recebe o conteúdo atual e a observação e muda só o que ela pede.
// Regenerar: a IA reescreve os textos a partir do original (a observação orienta).
// Reverter: volta ao texto do arquivo, sem IA.
export async function ajustarIdeia(returnTo: string, id: string, formData: FormData) {
  return reescrever(returnTo, id, "ajustar", formData);
}

export async function regenerarIdeia(returnTo: string, id: string, formData: FormData) {
  return reescrever(returnTo, id, "regenerar", formData);
}

async function reescrever(returnTo: string, id: string, modo: "ajustar" | "regenerar", formData: FormData) {
  await requireAdmin();
  const observacao = String(formData.get("observacao") ?? "").trim();

  const ideia = await db.ideiaNegocio.findUnique({ where: { id } });
  if (!ideia) redirect("/admin/pequenos-negocios");

  const original = negocioOriginalSchema.safeParse(ideia.dados);
  if (!original.success) comErro(returnTo, "Os dados originais desta ideia estão inválidos.");
  const base = conteudoDoOriginal(original.data!);

  let conteudoAtual: ConteudoIdeia | undefined;
  if (modo === "ajustar") {
    conteudoAtual = lerConteudo(ideia.conteudo) ?? undefined;
    if (!conteudoAtual) comErro(returnTo, "Não há conteúdo válido para ajustar. Use “Regenerar do zero”.");
    if (!observacao) comErro(returnTo, "Escreva na observação o que deve mudar. Sem ela não há o que ajustar.");
  }

  try {
    const novo = await reescreverIdeiaOpenAI({ dados: ideia.dados, base, conteudoAtual, observacao: observacao || undefined });
    await db.ideiaNegocio.update({
      where: { id },
      data: { conteudo: json(novo), resumo: novo.resumo, conteudoEditadoEm: new Date() },
    });
  } catch (err) {
    console.error("reescrever ideia", err);
    await logDebugError(`admin:${modo}Ideia`, err);
    comErro(returnTo, "Não foi possível gerar o texto agora. Tente de novo.");
  }

  atualizarTelas(returnTo, ideia.slug);
  redirect(returnTo);
}

export async function reverterIdeia(returnTo: string, id: string) {
  await requireAdmin();
  const ideia = await db.ideiaNegocio.findUnique({ where: { id } });
  if (!ideia) redirect("/admin/pequenos-negocios");

  const original = negocioOriginalSchema.safeParse(ideia.dados);
  if (!original.success) comErro(returnTo, "Os dados originais desta ideia estão inválidos.");
  const conteudo = conteudoDoOriginal(original.data!);

  await db.ideiaNegocio.update({
    where: { id },
    data: { conteudo: json(conteudo), resumo: conteudo.resumo, conteudoEditadoEm: null },
  });

  atualizarTelas(returnTo, ideia.slug);
  redirect(returnTo);
}

// Importa o repositório de src/data/repositorio-ideias.json.
//  - "teste": só 5 ideias (de 5 categorias), para conferir o resultado;
//  - "todos": as 105 e, quando todas estão no banco, APAGA os negócios antigos
//    (autorizado pelo dono do produto). Ideias já importadas nunca são
//    sobrescritas, para não perder ajustes feitos na revisão.
// Se o arquivo tiver qualquer erro, nada é importado nem apagado.
export async function importarRepositorio(returnTo: string, modo: "teste" | "todos") {
  await requireAdmin();

  const repositorio = (await import("@/data/repositorio-ideias.json")).default;
  const relatorio = prepararImportacao(repositorio);
  if (relatorio.erros.length > 0) {
    comErro(returnTo, `O arquivo tem ${relatorio.erros.length} problema(s): ${relatorio.erros.slice(0, 3).join("; ")}`);
  }

  const alvo = modo === "teste" ? relatorio.ideias.filter((i) => ORDENS_DO_TESTE.includes(i.ordem)) : relatorio.ideias;
  const existentes = new Set((await db.ideiaNegocio.findMany({ select: { origemId: true } })).map((x) => x.origemId));
  const novas = alvo.filter((i) => !existentes.has(i.origemId));

  if (novas.length > 0) {
    await db.ideiaNegocio.createMany({
      data: novas.map((i) => ({ ...i, dados: json(i.dados), conteudo: json(i.conteudo) })),
    });
  }

  let msg = `${novas.length} ideia(s) importada(s) como pendente(s); ${alvo.length - novas.length} já existia(m).`;

  if (modo === "todos") {
    const total = await db.ideiaNegocio.count();
    if (total >= relatorio.total) {
      // Só apaga o repositório antigo depois de confirmar que os 105 novos estão no banco.
      const antigos = await db.pequenoNegocio.deleteMany({});
      await db.subcategoriaNegocio.deleteMany({});
      msg += ` Os ${antigos.count} negócios antigos foram apagados.`;
    } else {
      msg += " Os antigos NÃO foram apagados porque nem todas as ideias novas estão no banco.";
    }
  }

  atualizarTelas(returnTo);
  comMsg(returnTo, msg);
}
