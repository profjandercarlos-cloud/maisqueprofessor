"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { donoDoNegocio } from "@/lib/plano/dono-do-negocio";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { MENSAGEM_COTA_ESGOTADA, cotaDePlanos } from "@/lib/planos/cota";
import {
  type EstagioInicial,
  NivelExecucao,
  type OrcamentoFaixa,
  type Prisma,
} from "@/generated/prisma/client";
import { generatePlanoDeAcoesOpenAI } from "@/lib/ai-engine/generate-plano-acoes-openai";
import { generateMapaExecucaoOpenAI, type MapaExecucao } from "@/lib/ai-engine/generate-mapa-execucao-openai";
import { logDebugError } from "@/lib/debug-error-log";
import { formatDiagnosticInput } from "@/lib/ai-engine/format-diagnostic-input";
import { getOrCreateAdequacaoResponse } from "@/lib/adequacao/get-active-response";
import { getResumeSlug } from "@/lib/adequacao/steps";

function fail(possibilityId: string, message: string): never {
  redirect(`/adequacao/${possibilityId}/concluido?error=${encodeURIComponent(message)}`);
}

// Cria o plano de execução (por ações) logo depois do questionário curto. Não há mais
// a Etapa de Especificação nem semanas: o plano nasce do primeiro serviço do negócio.
export async function generatePlan(possibilityId: string) {
  const user = await requireActiveAccess();

  const possibility = await db.possibility.findUnique({
    where: { id: possibilityId },
    include: { round: { include: { diagnostic: true } }, plan: true },
  });
  if (!possibility || donoDoNegocio(possibility) !== user.id) redirect("/");
  if (possibility.status === "REJEITADA") redirect("/");
  if (possibility.plan) redirect(`/planos/${possibility.plan.id}`);

  const response = await getOrCreateAdequacaoResponse(possibilityId);
  const answers = response.answers as Record<string, unknown>;
  const resumeSlug = getResumeSlug(answers);
  if (resumeSlug !== "concluido") {
    redirect(`/adequacao/${possibilityId}/${resumeSlug}`);
  }

  // A cota vem antes de qualquer chamada de IA: todo plano criado conta.
  const cota = cotaDePlanos(await db.plan.count({ where: { userId: user.id } }));
  if (cota.esgotada) {
    fail(possibilityId, MENSAGEM_COTA_ESGOTADA);
  }

  // O Mapa de Execução (invisível para a pessoa) só é gerado agora, na primeira vez
  // que ela chega até aqui com este negócio escolhido. Os 4 não escolhidos nunca
  // pagam essa chamada.
  let mapaExecucao = possibility.mapaExecucao as unknown as MapaExecucao | null;
  if (!mapaExecucao) {
    try {
      mapaExecucao = await generateMapaExecucaoOpenAI({
        diagnosticInput: possibility.round ? formatDiagnosticInput(possibility.round.diagnostic) : null,
        possibility: {
          titulo: possibility.titulo,
          comoFunciona: possibility.comoFunciona,
          porQueCombinaComVoce: possibility.porQueCombinaComVoce,
          comoGerarReceita: possibility.comoGerarReceita,
          primeiraValidacao: possibility.primeiraValidacao,
          pontoDeAtencao: possibility.pontoDeAtencao,
        },
      });
    } catch (err) {
      console.error("Erro ao gerar o Mapa de Execução", err);
      await logDebugError("adequacao:generateMapaExecucao", err);
      fail(possibilityId, "Não foi possível preparar seu negócio agora. Tente de novo em instantes.");
    }
    await db.possibility.update({
      where: { id: possibility.id },
      data: { mapaExecucao: mapaExecucao as unknown as Prisma.InputJsonValue },
    });
  }

  const tempoDisponivelHoras = Number(answers.horasSemanaisDisponiveis);
  const estagioInicial = answers.estagioInicial as EstagioInicial;
  const investimentoFaixa = answers.orcamentoTotal12Semanas as OrcamentoFaixa;

  let plano;
  try {
    plano = await generatePlanoDeAcoesOpenAI({
      negocio: {
        titulo: possibility.titulo,
        comoFunciona: possibility.comoFunciona,
        porQueCombinaComVoce: possibility.porQueCombinaComVoce,
        primeiroServico: possibility.primeiraValidacao,
        pontoDeAtencao: possibility.pontoDeAtencao,
      },
      mapaExecucao,
      estagioInicial,
      horasPorSemana: tempoDisponivelHoras,
      orcamentoFaixa: investimentoFaixa,
      diagnosticInput: possibility.round ? formatDiagnosticInput(possibility.round.diagnostic) : null,
    });
  } catch (err) {
    console.error("Erro ao gerar o plano de ações", err);
    await logDebugError("adequacao:generatePlanoDeAcoes", err);
    fail(possibilityId, "Não foi possível gerar seu plano agora. Tente de novo em instantes.");
  }

  await db.adequacaoResponse.update({ where: { id: response.id }, data: { status: "CONCLUIDO" } });

  // Conflito explícito: alguma condição informada impede o primeiro serviço. Não cria
  // o Plan e fecha este negócio de vez (REJEITADA), para a pessoa não repetir a chamada
  // mais cara do app indefinidamente.
  if (plano.encaixe.classificacao === "conflito_explicito") {
    await db.possibility.update({ where: { id: possibility.id }, data: { status: "REJEITADA" } });
    const aviso = encodeURIComponent(plano.encaixe.explicacao);
    redirect(
      possibility.roundId
        ? `/diagnostico/possibilidades/${possibility.roundId}?conflito=${aviso}`
        : `/planos?conflito=${aviso}`,
    );
  }

  // Só 1 plano ativo por vez — pausa qualquer outro antes de ativar este.
  await db.plan.updateMany({
    where: { userId: user.id, status: "ATIVO" },
    data: { status: "PAUSADO", pausedAt: new Date() },
  });

  const plan = await db.plan.create({
    data: {
      userId: user.id,
      possibilityId: possibility.id,
      tempoDisponivelHoras,
      horasNucleoSemana: tempoDisponivelHoras,
      investimentoFaixa,
      estagioInicial,
      classificacaoEncaixe: plano.encaixe.classificacao,
      resultadoMinimoViavel: plano.resumo.resultado_minimo_viavel,
      ttfrResultado: mapaExecucao.primeiroResultadoObservavel,
      relatorio: { versao: "acoes_v1", encaixe: plano.encaixe, resumo: plano.resumo } as Prisma.InputJsonValue,
      // Colunas do formato antigo (semanas), exigidas pelo banco mas sem uso nos planos
      // por ações: ficam com valores neutros. "Sistema recomenda" = nenhuma preferência.
      diaCheckin: 0,
      distribuicaoTempo: "AGENDA_VARIAVEL",
      regraSegurancaFinanceira: "NAO_SE_APLICA",
      equilibrioAprenderExecutar: "SISTEMA_RECOMENDA",
      ritmoDesejado: "SISTEMA_RECOMENDA",
      nivelExecucao: NivelExecucao.VALIDACAO,
      ttfrSemanas: Math.max(1, Math.round(mapaExecucao.ttfrBaseSemanas)),
      proporcaoAprendizado: 0,
      duracaoSemanas: 0,
      acoes: {
        create: plano.acoes.map((acao, index) => ({
          sequencia: index + 1,
          nome: acao.nome,
          objetivo: acao.objetivo,
          escopoMinimo: acao.definicao_de_pronto,
          orientacoes: {
            comoFazer: acao.como_fazer,
            pontosDeAtencao: acao.pontos_de_atencao,
            errosComuns: acao.erros_comuns,
          } as Prisma.InputJsonValue,
          itens: { create: acao.checklist.map((texto, i) => ({ sequencia: i + 1, texto })) },
        })),
      },
    },
  });

  await db.possibility.update({ where: { id: possibility.id }, data: { status: "APROVADA" } });

  redirect(`/planos/${plan.id}`);
}
