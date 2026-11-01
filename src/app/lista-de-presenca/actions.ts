"use server";

import { cookies } from "next/headers";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { DicaReacaoTipo } from "@/generated/prisma/client";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { triggerLoteDeDicas } from "@/lib/dicas/trigger-lote";
import { diaLocal } from "@/lib/presenca/dias";
import { COOKIE_ADIOU_PRESENCA, caminhoSeguro, contextoDaPessoa } from "@/lib/presenca/contexto";
import { marcarPresenca, reagirADica, salvarNotaDaDica } from "@/lib/presenca/servico";

const TIPOS: DicaReacaoTipo[] = ["GUARDADA", "JA_FACO", "NAO_E_PARA_MIM"];

// "Presente": a pessoa se compromete a executar hoje. É só aqui que o dia passa a contar.
export async function marcarPresencaAction() {
  const user = await requireActiveAccess();
  const contexto = await contextoDaPessoa(user.id);

  const resultado = await marcarPresenca(user.id, { nome: contexto.nome, proximaAcao: contexto.proximaAcao });
  // Se o banco de dicas está acabando para alguém, pede um lote novo em segundo plano.
  if (resultado.precisaLote) after(() => triggerLoteDeDicas());

  (await cookies()).delete(COOKIE_ADIOU_PRESENCA);
  revalidatePath("/");
  revalidatePath("/lista-de-presenca");
  redirect("/?presente=1");
}

// "Só passei por aqui": entra no app sem contar o dia. A chamada não volta a aparecer hoje;
// o Painel guarda um cartão discreto para marcar presença depois, se a pessoa quiser.
export async function adiarPresencaAction() {
  await requireActiveAccess();
  (await cookies()).set(COOKIE_ADIOU_PRESENCA, diaLocal(new Date()), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 36,
  });
  redirect("/");
}

export async function reagirAction(dicaId: string, tipo: string, voltar: string) {
  const user = await requireActiveAccess();
  if (!TIPOS.includes(tipo as DicaReacaoTipo)) redirect(caminhoSeguro(voltar));
  await reagirADica(user.id, dicaId, tipo as DicaReacaoTipo);
  revalidatePath("/lista-de-presenca");
  redirect(caminhoSeguro(voltar));
}

export async function salvarNotaAction(dicaId: string, voltar: string, formData: FormData) {
  const user = await requireActiveAccess();
  await salvarNotaDaDica(user.id, dicaId, String(formData.get("nota") ?? ""));
  revalidatePath("/lista-de-presenca");
  redirect(caminhoSeguro(voltar));
}
