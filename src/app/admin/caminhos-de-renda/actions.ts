"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/require-active-access";
import { adjustCaminhoRendaOpenAI, type CaminhoRendaWire } from "@/lib/ai-engine/adjust-caminho-renda-openai";
import { logDebugError } from "@/lib/debug-error-log";
import { Prisma } from "@/generated/prisma/client";
import type { CaminhoRenda, CaminhoRendaStatus } from "@/generated/prisma/client";

function fail(returnTo: string, message: string): never {
  redirect(`${returnTo}?error=${encodeURIComponent(message)}`);
}

const FORCA_EVIDENCIA_TO_WIRE: Record<string, CaminhoRendaWire["forca_evidencia"]> = {
  OFERTA_PUBLICADA: "oferta_publicada",
  PEDIDO_DOCUMENTADO: "pedido_documentado",
  SELECAO_CONCLUIDA: "selecao_concluida",
  CONTRATO_COM_VALOR: "contrato_com_valor",
  PILOTO_PAGO_DO_PROFESSOR: "piloto_pago_do_professor",
};
const FORCA_EVIDENCIA_FROM_WIRE = Object.fromEntries(
  Object.entries(FORCA_EVIDENCIA_TO_WIRE).map(([k, v]) => [v, k]),
) as Record<string, string>;

const RELACAO_DOCENCIA_TO_WIRE: Record<string, CaminhoRendaWire["relacao_com_docencia"]> = {
  ENSINO_FORA_DA_ESCOLA: "ensino_fora_da_escola",
  EDUCACAO_SEM_AULA: "educacao_sem_aula",
  OUTRO_SETOR: "outro_setor",
};
const RELACAO_DOCENCIA_FROM_WIRE = Object.fromEntries(
  Object.entries(RELACAO_DOCENCIA_TO_WIRE).map(([k, v]) => [v, k]),
) as Record<string, string>;

function toWire(registro: CaminhoRenda): CaminhoRendaWire {
  const preco = registro.precoReferenciaExterna as {
    valorBrl: number;
    unidade: string;
    escopoComparavel: boolean;
    fonte: string;
  } | null;

  return {
    titulo: registro.titulo,
    posicionamento: registro.posicionamento,
    categoria_mercado: registro.categoriaMercado,
    comprador_segmento: registro.compradorSegmento,
    comprador_persona: registro.compradorPersona,
    gatilho: registro.gatilho,
    forca_evidencia: FORCA_EVIDENCIA_TO_WIRE[registro.forcaEvidencia],
    fontes: registro.fontes as CaminhoRendaWire["fontes"],
    capacidade_a_verificar: registro.capacidadeAVerificar,
    relacao_com_docencia: RELACAO_DOCENCIA_TO_WIRE[registro.relacaoComDocencia],
    restricoes: registro.restricoes,
    primeira_entrega_vendavel: registro.primeiraEntregaVendavel,
    canal_de_acesso: registro.canalDeAcesso,
    modelo_de_receita: registro.modeloDeReceita,
    como_cresce: registro.comoCresce,
    risco_estrutural: registro.riscoEstrutural,
    preco_referencia_externa: preco
      ? { valor_brl: preco.valorBrl, unidade: preco.unidade, escopo_comparavel: preco.escopoComparavel, fonte: preco.fonte }
      : null,
    preco_primeiro_contrato_real: registro.precoPrimeiroContratoReal,
    horas_reais_por_entrega: registro.horasReaisPorEntrega,
    renda_mensal_liquida_observada: registro.rendaMensalLiquidaObservada,
    habilidade_nuclear: registro.habilidadeNuclear,
    modalidade: registro.modalidade,
    capital: registro.capital,
    mecanismo_renda: registro.mecanismoRenda,
    investigavel_no_diagnostico: registro.investigavelNoDiagnostico,
    grupo_de_ofertas_semelhantes: registro.grupoDeOfertasSemelhantes,
    principal_lacuna: registro.principalLacuna,
    teste_piloto_necessario: registro.testePilotoNecessario,
  };
}

function fromWire(wire: CaminhoRendaWire): Prisma.CaminhoRendaUpdateInput {
  return {
    titulo: wire.titulo,
    posicionamento: wire.posicionamento,
    categoriaMercado: wire.categoria_mercado,
    compradorSegmento: wire.comprador_segmento,
    compradorPersona: wire.comprador_persona,
    gatilho: wire.gatilho,
    forcaEvidencia: FORCA_EVIDENCIA_FROM_WIRE[wire.forca_evidencia] as CaminhoRenda["forcaEvidencia"],
    fontes: wire.fontes as Prisma.InputJsonValue,
    capacidadeAVerificar: wire.capacidade_a_verificar,
    relacaoComDocencia: RELACAO_DOCENCIA_FROM_WIRE[wire.relacao_com_docencia] as CaminhoRenda["relacaoComDocencia"],
    restricoes: wire.restricoes,
    primeiraEntregaVendavel: wire.primeira_entrega_vendavel,
    canalDeAcesso: wire.canal_de_acesso,
    modeloDeReceita: wire.modelo_de_receita,
    comoCresce: wire.como_cresce,
    riscoEstrutural: wire.risco_estrutural,
    precoReferenciaExterna: wire.preco_referencia_externa
      ? ({
          valorBrl: wire.preco_referencia_externa.valor_brl,
          unidade: wire.preco_referencia_externa.unidade,
          escopoComparavel: wire.preco_referencia_externa.escopo_comparavel,
          fonte: wire.preco_referencia_externa.fonte,
        } as Prisma.InputJsonValue)
      : Prisma.DbNull,
    precoPrimeiroContratoReal: wire.preco_primeiro_contrato_real,
    horasReaisPorEntrega: wire.horas_reais_por_entrega,
    rendaMensalLiquidaObservada: wire.renda_mensal_liquida_observada,
    habilidadeNuclear: wire.habilidade_nuclear,
    modalidade: wire.modalidade,
    capital: wire.capital,
    mecanismoRenda: wire.mecanismo_renda,
    investigavelNoDiagnostico: wire.investigavel_no_diagnostico,
    grupoDeOfertasSemelhantes: wire.grupo_de_ofertas_semelhantes,
    principalLacuna: wire.principal_lacuna,
    testePilotoNecessario: wire.teste_piloto_necessario,
  };
}

export async function revisarCaminho(
  returnTo: string,
  id: string,
  novoStatus: CaminhoRendaStatus,
  formData: FormData,
) {
  await requireAdmin();
  const nota = String(formData.get("nota") ?? "").trim();

  await db.caminhoRenda.update({
    where: { id },
    data: { status: novoStatus, notaRevisao: nota || null },
  });

  revalidatePath("/admin/caminhos-de-renda");
  revalidatePath(returnTo);
  redirect(returnTo);
}

export async function ajustarComIA(returnTo: string, id: string, formData: FormData) {
  await requireAdmin();
  const nota = String(formData.get("nota") ?? "").trim();
  if (!nota) fail(returnTo, "Escreva o que precisa ser ajustado antes de pedir a correção por IA.");

  const registro = await db.caminhoRenda.findUnique({ where: { id } });
  if (!registro) fail(returnTo, "Caminho de renda não encontrado.");

  let corrigido;
  try {
    corrigido = await adjustCaminhoRendaOpenAI({ registro: toWire(registro), nota });
  } catch (err) {
    console.error("Erro ao ajustar Caminho de Renda com IA", err);
    await logDebugError("admin:ajustarCaminhoRenda", err);
    fail(returnTo, `Não foi possível ajustar agora: ${err instanceof Error ? err.message : "erro desconhecido"}`);
  }

  await db.caminhoRenda.update({
    where: { id },
    data: { ...fromWire(corrigido), notaRevisao: nota, status: "PENDENTE_REVISAO" },
  });

  revalidatePath("/admin/caminhos-de-renda");
  revalidatePath(returnTo);
  redirect(returnTo);
}
