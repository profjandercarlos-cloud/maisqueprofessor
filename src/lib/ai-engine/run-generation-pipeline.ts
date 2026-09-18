// Fila de geração V4 — cada fase roda como sua PRÓPRIA invocação HTTP (ver
// src/app/api/internal/generation-step/route.ts e trigger-generation-step.ts),
// não uma função dentro do mesmo after() do V3. runGenerationStep(roundId)
// lê round.status e executa só a fase correspondente:
//
//   PENDENTE   → gera o rascunho completo (5 possibilidades + 5 reservas)
//   VALIDANDO  → audita o rascunho atual; aprova e persiste, ou pede correção
//   CORRIGINDO → corrige só os papéis sinalizados, volta pra VALIDANDO
//
// "No máximo uma correção direcionada": se a verificação final (2ª
// auditoria, correcaoTentada já true) ainda reprovar algum papel, tenta
// promover a reserva daquele papel (sem nova auditoria, pra não entrar em
// loop) antes de desistir (FALHOU).
import { db } from "@/lib/db";
import type { Diagnostic, GenerationRoundStatus, Prisma } from "@/generated/prisma/client";
import { formatDiagnosticInput } from "./format-diagnostic-input";
import { buildEntradaEconomica } from "./build-generation-input";
import { buildIncrementoTexto } from "@/lib/diagnostico/increment-steps";
import {
  generatePossibilitiesOpenAI,
  buildEntradaTexto,
  mapPossibilityToGenerated,
  possibilitySchema,
  type GeneratorDraft,
} from "./generate-possibilities-openai";
import { auditPossibilitiesOpenAI, type AuditResult } from "./audit-possibilities-openai";
import { correctPossibilitiesOpenAI } from "./correct-possibilities-openai";
import { triggerGenerationStep } from "./trigger-generation-step";
import { triggerMarketPresentationStep } from "./trigger-market-presentation-step";
import { logDebugError } from "@/lib/debug-error-log";
import type { z } from "zod";

type PossibilityDraft = z.infer<typeof possibilitySchema>;

// A rota interna (api/internal/generation-step) tem maxDuration=120s — a
// Vercel mata a função antes disso se ela ainda estiver rodando. Um lock
// mais velho que isso só pode ser de uma invocação que já morreu (matada
// pela plataforma ou por erro não tratado), nunca de uma ainda em curso —
// por isso é seguro reivindicar de novo depois desse prazo.
export const CLAIM_TIMEOUT_MS = 150_000;

// Reivindica a fase ANTES de chamar a OpenAI (não só na gravação final) —
// evita não só persistir duas vezes, mas também pagar duas vezes pela
// chamada de IA quando duas invocações da mesma fase disparam em paralelo
// (a retomada de rodada travada em polling-wait.tsx dispara de novo se não
// vir atualização em 180s). Só avança quem conseguir mudar o status
// esperado E encontrar claimedAt vazio ou expirado; quem perde a corrida
// encontra count !== 1 e retorna sem chamar a OpenAI.
export async function claimPhase(roundId: string, expectedStatus: GenerationRoundStatus): Promise<boolean> {
  const result = await db.generationRound.updateMany({
    where: {
      id: roundId,
      status: expectedStatus,
      OR: [{ claimedAt: null }, { claimedAt: { lt: new Date(Date.now() - CLAIM_TIMEOUT_MS) } }],
    },
    data: { claimedAt: new Date() },
  });
  return result.count === 1;
}

// Controle de concorrência otimista na escrita que FECHA cada fase — além
// do claimPhase acima (que já devia garantir exclusividade), esta segunda
// checagem é defensiva: confirma de novo que o status ainda é o esperado
// antes de gravar o resultado e limpa claimedAt pra fase seguinte poder
// reivindicar do zero. Quem perder a corrida encontra count !== 1 e para
// sem duplicar nada nem disparar a próxima fase de novo.
async function claimTransition(
  roundId: string,
  fromStatus: GenerationRoundStatus,
  data: Prisma.GenerationRoundUpdateManyMutationInput,
): Promise<boolean> {
  const result = await db.generationRound.updateMany({
    where: { id: roundId, status: fromStatus },
    data: { ...data, claimedAt: null },
  });
  return result.count === 1;
}

export async function runGenerationStep(roundId: string): Promise<void> {
  try {
    const round = await db.generationRound.findUnique({
      where: { id: roundId },
      include: { diagnostic: true },
    });
    if (!round) return;

    if (round.status !== "PENDENTE" && round.status !== "VALIDANDO" && round.status !== "CORRIGINDO") {
      return; // fase já concluída/terminal (ou legado V3) — nada a fazer
    }

    const claimed = await claimPhase(roundId, round.status);
    if (!claimed) return; // outra invocação já está processando esta fase agora

    switch (round.status) {
      case "PENDENTE":
        await runGeracao(roundId, round.diagnostic);
        break;
      case "VALIDANDO":
        await runValidacao(roundId, round.diagnostic.id, round.rascunhoAtual, round.correcaoTentada);
        break;
      case "CORRIGINDO":
        await runCorrecao(roundId, round.diagnostic.id, round.rascunhoAtual, round.auditoriaAtual);
        break;
    }
  } catch (err) {
    console.error("Erro numa fase da fila de geração", err);
    await logDebugError("run-generation-pipeline:erro", err);
    await db.generationRound.update({ where: { id: roundId }, data: { status: "FALHOU", claimedAt: null } }).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Fase PENDENTE — gera o rascunho completo.
// ---------------------------------------------------------------------------
async function runGeracao(roundId: string, diagnostic: Diagnostic): Promise<void> {
  const baseDiagnosticInput = formatDiagnosticInput(diagnostic);
  const diagnosticInput = diagnostic.incrementAnswers
    ? `${baseDiagnosticInput}\n\nINCREMENTO DE DIAGNÓSTICO (perguntas adicionais, após rodadas sem aprovação)\n${buildIncrementoTexto(diagnostic.incrementAnswers)}`
    : baseDiagnosticInput;

  const entradaEconomica = buildEntradaEconomica(diagnostic);

  const rounds = await db.generationRound.findMany({
    where: { diagnosticId: diagnostic.id },
    include: { possibilities: true },
  });
  const rejectedTitles = rounds.flatMap((r) => r.possibilities.map((p) => p.titulo));
  const currentRound = rounds.find((r) => r.id === roundId);
  const feedback = currentRound?.feedbackText ?? undefined;

  const draft = await generatePossibilitiesOpenAI({
    diagnosticInput,
    entradaEconomica,
    feedback,
    rejectedTitles,
  });

  const claimed = await claimTransition(roundId, "PENDENTE", {
    rascunhoAtual: draft as unknown as Prisma.InputJsonValue,
    status: "VALIDANDO",
  });
  if (!claimed) return; // outra invocação concorrente já avançou esta rodada

  await triggerGenerationStep(roundId);
}

// ---------------------------------------------------------------------------
// Fase VALIDANDO — audita o rascunho atual (1ª vez ou verificação final).
// ---------------------------------------------------------------------------
async function runValidacao(
  roundId: string,
  diagnosticId: string,
  rascunhoRaw: Prisma.JsonValue | null,
  correcaoTentada: boolean,
): Promise<void> {
  const draft = rascunhoRaw as unknown as GeneratorDraft | null;
  if (!draft) {
    throw new Error("Round em VALIDANDO sem rascunhoAtual.");
  }

  const diagnostic = await db.diagnostic.findUniqueOrThrow({ where: { id: diagnosticId } });
  const baseDiagnosticInput = formatDiagnosticInput(diagnostic);
  const diagnosticInput = diagnostic.incrementAnswers
    ? `${baseDiagnosticInput}\n\nINCREMENTO DE DIAGNÓSTICO (perguntas adicionais, após rodadas sem aprovação)\n${buildIncrementoTexto(diagnostic.incrementAnswers)}`
    : baseDiagnosticInput;
  const entradaEconomica = buildEntradaEconomica(diagnostic);
  const entradaTexto = buildEntradaTexto(diagnosticInput, entradaEconomica);

  const auditoria = await auditPossibilitiesOpenAI({
    entrada: entradaTexto,
    rascunho: draft,
    tentativa: correcaoTentada ? 2 : 1,
  });

  if (auditoria.status === "aprovar") {
    await persistApproved(roundId, diagnosticId, draft);
    return;
  }

  if (!correcaoTentada) {
    const claimed = await claimTransition(roundId, "VALIDANDO", {
      auditoriaAtual: auditoria as unknown as Prisma.InputJsonValue,
      correcaoTentada: true,
      status: "CORRIGINDO",
    });
    if (!claimed) return; // outra invocação concorrente já avançou esta rodada
    await triggerGenerationStep(roundId);
    return;
  }

  // Verificação final depois de uma correção já reprovou de novo — tenta
  // promover a reserva de cada papel ainda reprovado, sem outra auditoria
  // (evita loop). Se a própria promoção falhar tecnicamente, o catch
  // genérico de runGenerationStep marca FALHOU.
  await promoteReservasEPersistir(roundId, diagnosticId, draft, entradaTexto, auditoria);
}

// ---------------------------------------------------------------------------
// Fase CORRIGINDO — corrige só os papéis sinalizados pelo auditor.
// ---------------------------------------------------------------------------
async function runCorrecao(
  roundId: string,
  diagnosticId: string,
  rascunhoRaw: Prisma.JsonValue | null,
  auditoriaRaw: Prisma.JsonValue | null,
): Promise<void> {
  const draft = rascunhoRaw as unknown as GeneratorDraft | null;
  const auditoria = auditoriaRaw as unknown as AuditResult | null;
  if (!draft || !auditoria) {
    throw new Error("Round em CORRIGINDO sem rascunhoAtual/auditoriaAtual.");
  }

  const diagnostic = await db.diagnostic.findUniqueOrThrow({ where: { id: diagnosticId } });
  const baseDiagnosticInput = formatDiagnosticInput(diagnostic);
  const diagnosticInput = diagnostic.incrementAnswers
    ? `${baseDiagnosticInput}\n\nINCREMENTO DE DIAGNÓSTICO (perguntas adicionais, após rodadas sem aprovação)\n${buildIncrementoTexto(diagnostic.incrementAnswers)}`
    : baseDiagnosticInput;
  const entradaEconomica = buildEntradaEconomica(diagnostic);
  const entradaTexto = buildEntradaTexto(diagnosticInput, entradaEconomica);

  const mantidas = draft.possibilidades.filter((p) => auditoria.manter.includes(p.ordem));
  const papeisSubstituir = auditoria.substituir.map((ordem) => {
    const original = draft.possibilidades.find((p) => p.ordem === ordem);
    return {
      ordem,
      papel: original?.papel ?? "",
      motivos: auditoria.motivo.find((m) => m.ordem === ordem)?.motivos ?? [],
    };
  });

  const correcao = await correctPossibilitiesOpenAI({
    entradaTexto,
    mantidas,
    modo: "auditor",
    papeisSubstituir,
  });

  const novoDraft = mergeCorrigidas(draft, correcao.possibilidades_corrigidas);

  const claimed = await claimTransition(roundId, "CORRIGINDO", {
    rascunhoAtual: novoDraft as unknown as Prisma.InputJsonValue,
    status: "VALIDANDO",
  });
  if (!claimed) return; // outra invocação concorrente já avançou esta rodada

  await triggerGenerationStep(roundId);
}

function mergeCorrigidas(draft: GeneratorDraft, corrigidas: PossibilityDraft[]): GeneratorDraft {
  const possibilidades = draft.possibilidades.map((p) => {
    const corrigida = corrigidas.find((c) => c.ordem === p.ordem);
    return corrigida ?? p;
  });
  return { ...draft, possibilidades };
}

// ---------------------------------------------------------------------------
// Promoção de reserva — último recurso quando a correção direcionada já foi
// usada e a verificação final ainda reprova algum papel.
// ---------------------------------------------------------------------------
async function promoteReservasEPersistir(
  roundId: string,
  diagnosticId: string,
  draft: GeneratorDraft,
  entradaTexto: string,
  auditoria: AuditResult,
): Promise<void> {
  let draftAtual = draft;

  for (const ordem of auditoria.substituir) {
    const original = draftAtual.possibilidades.find((p) => p.ordem === ordem);
    const reserva = draftAtual.reservas.find((r) => r.papel === original?.papel);
    if (!original || !reserva) {
      throw new Error(`Sem reserva disponível pra promover no papel da ordem ${ordem}.`);
    }

    const mantidas = draftAtual.possibilidades.filter((p) => p.ordem !== ordem);

    const correcao = await correctPossibilitiesOpenAI({
      entradaTexto,
      mantidas,
      modo: "reserva",
      ordem,
      papel: original.papel,
      reserva: {
        territorio: reserva.territorio,
        problema: reserva.problema,
        publico: reserva.publico,
        pagador: reserva.pagador,
        entrega: reserva.entrega,
        modeloReceita: reserva.modelo_receita,
        motivoReserva: reserva.motivo_reserva,
      },
    });

    draftAtual = mergeCorrigidas(draftAtual, correcao.possibilidades_corrigidas);

    await logDebugError(
      "run-generation-pipeline:reserva-promovida",
      new Error(`Round ${roundId}: reserva do papel ${original.papel} (ordem ${ordem}) promovida após correção direcionada reprovada de novo.`),
    );
  }

  await db.generationRound.update({
    where: { id: roundId },
    data: { rascunhoAtual: draftAtual as unknown as Prisma.InputJsonValue },
  });

  await persistApproved(roundId, diagnosticId, draftAtual);
}

// ---------------------------------------------------------------------------
// Persistência final — grava as 5 Possibility e fecha o round como CONCLUIDO.
// ---------------------------------------------------------------------------
async function persistApproved(roundId: string, diagnosticId: string, draft: GeneratorDraft): Promise<void> {
  // Reivindica a transição pros campos escalares primeiro — updateMany não
  // aceita write aninhado (create de Possibility), então o create real só
  // roda depois de confirmar que fomos nós quem passou de VALIDANDO pra
  // CONCLUIDO. Uma 2ª invocação concorrente encontra count 0 aqui (o status
  // já não é mais VALIDANDO) e nunca chega a criar possibilidades
  // duplicadas.
  const claimed = await claimTransition(roundId, "VALIDANDO", {
    status: "CONCLUIDO",
    versaoMotor: draft.versao_motor,
    avisoEconomico: draft.aviso_economico,
    metaFinanceiraUsada: {
      valorMensal: draft.meta_financeira_usada.valor_mensal,
      natureza: draft.meta_financeira_usada.natureza,
      prazoDesejado: draft.meta_financeira_usada.prazo_desejado,
    } as unknown as Prisma.InputJsonValue,
  });
  if (!claimed) return; // outra invocação concorrente já persistiu esta rodada

  const possibilidades = draft.possibilidades.map(mapPossibilityToGenerated);

  await db.generationRound.update({
    where: { id: roundId },
    data: {
      possibilities: {
        create: possibilidades.map((p) => ({
          papel: p.papel,
          titulo: p.titulo,
          subtitulo: p.subtitulo,
          tempoPrimeiraValidacao: p.tempoPrimeiraValidacao,
          horizonteRelevanciaFinanceira: p.horizonteRelevanciaFinanceira,
          baseNoHistorico: p.baseNoHistorico,
          destaque: p.destaque,
          comoFunciona: p.comoFunciona,
          comoGerarReceita: p.comoGerarReceita,
          porQueCombinaComVoce: p.porQueCombinaComVoce,
          primeiraValidacao: p.primeiraValidacao,
          pontoDeAtencao: p.pontoDeAtencao,
          impressaoDigital: p.impressaoDigital as unknown as Prisma.InputJsonValue,
          analiseConvergenciaComercial: p.analiseConvergenciaComercial as unknown as Prisma.InputJsonValue,
        })),
      },
    },
  });

  // Sucesso desta rodada — fecha as possibilidades ainda PENDENTE de
  // qualquer OUTRA rodada do mesmo diagnóstico (substitui o antigo
  // previousRoundId/markRoundPossibilitiesRejeitadas: agora deriva tudo do
  // diagnosticId, sem precisar de opção externa passada entre fases).
  await db.possibility.updateMany({
    where: { round: { diagnosticId, id: { not: roundId } }, status: "PENDENTE" },
    data: { status: "REJEITADA" },
  });

  // Camada aditiva de apresentação de mercado (ver
  // market-presentation-prompt.ts) — fase própria, HTTP separado, nunca
  // bloqueia o round em si. Só quem realmente persistiu esta rodada
  // dispara (claimed === true), evitando disparo duplicado.
  await triggerMarketPresentationStep(roundId);
}
