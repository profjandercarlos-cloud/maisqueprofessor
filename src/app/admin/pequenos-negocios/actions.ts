"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-active-access";
import { logDebugError } from "@/lib/debug-error-log";
import { gerarFichaProfessorOpenAI } from "@/lib/ai-engine/gerar-ficha-professor-openai";
import { FICHAS_EXEMPLO } from "@/lib/negocios/ficha-exemplos";
import type { CaminhoRendaStatus, Prisma } from "@/generated/prisma/client";

export async function revisarNegocio(
  returnTo: string,
  id: string,
  novoStatus: CaminhoRendaStatus,
  formData: FormData,
) {
  await requireAdmin();
  const nota = String(formData.get("nota") ?? "").trim();

  await db.pequenoNegocio.update({
    where: { id },
    data: { status: novoStatus, notaRevisao: nota || null },
  });

  revalidatePath("/admin/pequenos-negocios");
  revalidatePath(returnTo);
  redirect(returnTo);
}

// Gera (ou regenera) a ficha do professor de UM negócio. Observação opcional do
// revisor orienta a reescrita. Erro volta para a tela como mensagem, sem 500.
export async function gerarFichaNegocio(returnTo: string, id: string, formData: FormData) {
  await requireAdmin();
  const observacao = String(formData.get("observacao") ?? "").trim();

  const negocio = await db.pequenoNegocio.findUnique({ where: { id } });
  if (!negocio) redirect("/admin/pequenos-negocios");

  try {
    const ficha = await gerarFichaProfessorOpenAI(negocio, observacao || undefined);
    await db.pequenoNegocio.update({
      where: { id },
      data: { ficha: ficha as unknown as Prisma.InputJsonValue, fichaGeradaEm: new Date() },
    });
  } catch (err) {
    console.error("gerarFichaNegocio", err);
    await logDebugError("admin:gerarFichaNegocio", err);
    redirect(`${returnTo}?error=${encodeURIComponent("Não foi possível gerar a ficha agora. Tente de novo.")}`);
  }

  revalidatePath("/admin/pequenos-negocios");
  revalidatePath(returnTo);
  revalidatePath(`/negocios/${negocio.codigo}`);
  redirect(returnTo);
}

// Quantos negócios uma chamada processa: cada ficha leva de dezenas de segundos
// a ~1 min, e a tela tem teto de 300 s (maxDuration). Rodar de novo continua
// de onde parou, porque só pega quem ainda não tem ficha.
const LOTE_FICHAS = 4;

export async function gerarFichasPendentes(returnTo: string) {
  await requireAdmin();

  const pendentes = await db.pequenoNegocio.findMany({
    where: { fichaGeradaEm: null },
    orderBy: { codigo: "asc" },
    take: LOTE_FICHAS,
  });

  const resultados = await Promise.allSettled(
    pendentes.map(async (n) => {
      // As fichas escritas à mão e aprovadas entram direto, sem chamar a IA.
      const ficha = FICHAS_EXEMPLO[n.codigo] ?? (await gerarFichaProfessorOpenAI(n));
      await db.pequenoNegocio.update({
        where: { id: n.id },
        data: { ficha: ficha as unknown as Prisma.InputJsonValue, fichaGeradaEm: new Date() },
      });
    }),
  );

  let ok = 0;
  for (const [i, r] of resultados.entries()) {
    if (r.status === "fulfilled") ok++;
    else {
      console.error("gerarFichasPendentes", pendentes[i]?.codigo, r.reason);
      await logDebugError(`admin:gerarFichasPendentes:${pendentes[i]?.codigo}`, r.reason);
    }
  }

  const restantes = await db.pequenoNegocio.count({ where: { fichaGeradaEm: null } });
  const falhas = pendentes.length - ok;
  const msg =
    pendentes.length === 0
      ? "Todas as fichas já foram geradas."
      : `${ok} ficha(s) gerada(s)${falhas ? `, ${falhas} falharam (rode de novo)` : ""}. Faltam ${restantes}.`;

  revalidatePath("/admin/pequenos-negocios");
  redirect(`${returnTo}?msg=${encodeURIComponent(msg)}`);
}
