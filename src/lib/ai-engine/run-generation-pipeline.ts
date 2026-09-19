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
import type { Diagnostic, GenerationRoundStatus, PossibilityRole, Prisma } from "@/generated/prisma/client";
import { formatDiagnosticInput } from "./format-diagnostic-input";
import { buildEntradaEconomica } from "./build-generation-input";
import { buildIncrementoTexto, buildContextualQ1, getSelecaoAjuste } from "@/lib/diagnostico/increment-steps";
import {
  generatePossibilitiesOpenAI,
  buildEntradaTexto,
  mapPossibilityToGenerated,
  mapPossibilityRowToDraft,
  possibilitySchema,
  ROLE_MAP,
  type GeneratorDraft,
} from "./generate-possibilities-openai";
import { auditPossibilitiesOpenAI, type AuditResult } from "./audit-possibilities-openai";
import { correctPossibilitiesOpenAI } from "./correct-possibilities-openai";
import { triggerGenerationStep } from "./trigger-generation-step";
import { logDebugError } from "@/lib/debug-error-log";
import type { z } from "zod";

type PossibilityDraft = z.infer<typeof possibilitySchema>;

// Inverso de ROLE_MAP (enum PossibilityRole → papel snake_case do rascunho) —
// usado só pelo ajuste seletivo, que recebe os papéis a trocar como enum
// (mesmo valor de Possibility.papel) mas precisa cruzar com `ordem` dentro
// do rascunho JSON, que usa a chave snake_case.
const ROLE_MAP_INVERSO: Record<string, string> = Object.fromEntries(
  Object.entries(ROLE_MAP).map(([snake, enumValue]) => [enumValue, snake]),
);

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
        await runValidacao(
          roundId,
          round.diagnostic.id,
          round.rascunhoAtual,
          round.correcaoTentada,
          round.papeisSeletivosTrocar as unknown as string[] | null,
        );
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
// Ajuste seletivo — a pessoa escolhe manter algumas das 5 possibilidades e
// trocar só as outras (em vez de refazer o conjunto inteiro). Reaproveita o
// rascunho já salvo desta mesma rodada (que já tem o macro nicho, as 5
// possibilidades completas e as reservas — nada disso é apagado quando a
// rodada chega a CONCLUIDO) e semeia uma auditoria sintética que já chega
// pronta em CORRIGINDO, pulando a 1ª auditoria automática (o motivo da troca
// aqui não é semântico, é a escolha explícita da pessoa). Dali em diante é
// exatamente o mesmo pipeline de sempre: corrige só os papéis marcados,
// audita o resultado (com a trava de papeisSeletivosTrocar em runValidacao
// garantindo que nenhum papel mantido seja tocado, nem por sugestão do
// auditor), e só then persiste — reaproveitando também a promoção de reserva
// como rede de segurança se a correção falhar de novo.
//
// Só grava no banco (status → CORRIGINDO) — NUNCA dispara a fase sozinha.
// Precisa ser chamada com `await` direto na Server Action, antes do
// redirect, pra a página de destino já enxergar o status novo assim que
// carregar; quem chama decide como disparar `triggerGenerationStep` (via
// `after()`, sem bloquear o redirect). Antes desta função também disparar a
// fase, o redirect acontecia antes do `after()` rodar, e a pessoa caía na
// tela vendo as possibilidades antigas por alguns segundos, achando que
// nada tinha acontecido.
export async function startSelectiveAdjustment(roundId: string, papeisTrocarEnumBruto: string[]): Promise<void> {
  const round = await db.generationRound.findUniqueOrThrow({
    where: { id: roundId },
    include: { possibilities: true },
  });
  const draftBase = round.rascunhoAtual as unknown as GeneratorDraft | null;
  if (!draftBase || round.possibilities.length !== 5) {
    throw new Error(`Round ${roundId} sem rascunhoAtual/possibilidades completas — não é possível fazer ajuste seletivo.`);
  }
  // Reconstrói `possibilidades` a partir das Possibility já persistidas (a
  // fonte da verdade), não do rascunhoAtual salvo — que pode ter ficado
  // desatualizado se uma correção anterior gerou conteúdo novo mas falhou
  // antes de persistir (ex.: erro de API no meio da promoção de reserva).
  // Os campos de nível de rodada (reservas, macro nicho etc.) continuam
  // vindo do rascunho, já que nunca são reescritos por uma correção.
  const draft: GeneratorDraft = {
    ...draftBase,
    possibilidades: round.possibilities.map(mapPossibilityRowToDraft),
  };

  // Defesa contra corrida: a seleção foi validada contra planos existentes
  // na hora de salvar (ver possibilidades/[roundId]/ajustar/actions.ts), mas
  // um Plano pode ter sido criado depois disso e antes desta execução (ex.:
  // a pessoa concluiu a adequação de uma possibilidade numa aba enquanto
  // respondia as perguntas do ajuste seletivo em outra). Reconfirma agora,
  // no momento em que a troca de fato vai acontecer.
  const travadasAgora = await db.possibility.findMany({
    where: { roundId, plan: { isNot: null } },
    select: { papel: true },
  });
  const papeisTravados = new Set<string>(travadasAgora.map((p) => p.papel));
  const papeisTrocarEnum = papeisTrocarEnumBruto.filter((p) => !papeisTravados.has(p));
  if (papeisTrocarEnum.length !== papeisTrocarEnumBruto.length) {
    await logDebugError(
      "run-generation-pipeline:ajuste-seletivo-corrida-plano",
      new Error(`Round ${roundId}: papel(is) com plano criado depois da seleção — removido(s) da troca antes de executar.`),
    );
  }
  if (papeisTrocarEnum.length === 0) {
    throw new Error(`Round ${roundId}: todos os papéis selecionados pra troca já têm plano — nada a fazer.`);
  }

  const papeisSnakeTrocar = new Set(papeisTrocarEnum.map((p) => ROLE_MAP_INVERSO[p]));
  const ordensSubstituir = draft.possibilidades.filter((p) => papeisSnakeTrocar.has(p.papel)).map((p) => p.ordem);
  const ordensManter = draft.possibilidades.map((p) => p.ordem).filter((ordem) => !ordensSubstituir.includes(ordem));
  if (ordensManter.length === 0) {
    throw new Error(
      `Round ${roundId}: ajuste seletivo pedido sem nenhuma possibilidade mantida — isso deveria ter caído no fluxo de regeneração completa, não aqui.`,
    );
  }

  const auditoriaSintetica: AuditResult = {
    status: "corrigir",
    manter: ordensManter,
    substituir: ordensSubstituir,
    motivo: ordensSubstituir.map((ordem) => ({
      ordem,
      motivos: [
        "Ajuste seletivo pedido pela própria pessoa — ver as respostas dela na seção INCREMENTO DE DIAGNÓSTICO da entrada, sobre especificamente o que não conversou nesta possibilidade.",
      ],
    })),
  };

  await db.generationRound.update({
    where: { id: roundId },
    data: {
      rascunhoAtual: draft as unknown as Prisma.InputJsonValue,
      auditoriaAtual: auditoriaSintetica as unknown as Prisma.InputJsonValue,
      papeisSeletivosTrocar: papeisTrocarEnum as unknown as Prisma.InputJsonValue,
      correcaoTentada: false,
      status: "CORRIGINDO",
      claimedAt: null,
    },
  });
}

// Monta a entrada completa do diagnóstico, incluindo o bloco de incremento
// quando existir — com a 1ª pergunta contextualizada com os títulos reais
// das possibilidades mantidas/trocadas, se esta rodada veio de um ajuste
// seletivo (ver possibilidades/[roundId]/ajustar). Usado pelas 3 fases.
async function buildDiagnosticInputCompleto(diagnostic: Diagnostic): Promise<string> {
  const baseDiagnosticInput = formatDiagnosticInput(diagnostic);
  if (!diagnostic.incrementAnswers) return baseDiagnosticInput;

  let q1Override: string | undefined;
  const selecao = getSelecaoAjuste(diagnostic.incrementAnswers);
  if (selecao) {
    const roundSelecao = await db.generationRound.findUnique({
      where: { id: selecao.roundId },
      include: { possibilities: true },
    });
    if (roundSelecao) {
      const titulosTrocar = roundSelecao.possibilities
        .filter((p) => selecao.papeisTrocar.includes(p.papel))
        .map((p) => p.titulo);
      const titulosManter = roundSelecao.possibilities
        .filter((p) => !selecao.papeisTrocar.includes(p.papel))
        .map((p) => p.titulo);
      q1Override = buildContextualQ1(titulosManter, titulosTrocar);
    }
  }

  return `${baseDiagnosticInput}\n\nINCREMENTO DE DIAGNÓSTICO (perguntas adicionais, após rodadas sem aprovação)\n${buildIncrementoTexto(diagnostic.incrementAnswers, q1Override)}`;
}

// ---------------------------------------------------------------------------
// Fase PENDENTE — gera o rascunho completo.
// ---------------------------------------------------------------------------
async function runGeracao(roundId: string, diagnostic: Diagnostic): Promise<void> {
  const diagnosticInput = await buildDiagnosticInputCompleto(diagnostic);

  const entradaEconomica = buildEntradaEconomica(diagnostic);

  const rounds = await db.generationRound.findMany({
    where: { diagnosticId: diagnostic.id },
    include: { possibilities: true },
  });
  const rejectedTitles = rounds.flatMap((r) => r.possibilities.map((p) => p.titulo));
  // Conteúdo de fato (não só o título) das possibilidades já mostradas nesta
  // e em rodadas anteriores — a impressão digital já guarda território,
  // problema, entrega e modelo de receita em formato compacto, então não
  // precisa de nenhuma chamada extra pra montar isso (ver B11 "Diversidade
  // entre rodadas" em system-prompt.ts).
  const territoriosJaTentados = rounds.flatMap((r) =>
    r.possibilities.map((p) => {
      const impressao = p.impressaoDigital as unknown as {
        territorio?: string;
        problema?: string;
        entrega?: string;
        modeloReceita?: string;
      } | null;
      return {
        territorio: impressao?.territorio ?? p.titulo,
        problema: impressao?.problema ?? "não registrado",
        entrega: impressao?.entrega ?? "não registrado",
        modeloReceita: impressao?.modeloReceita ?? "não registrado",
      };
    }),
  );
  const currentRound = rounds.find((r) => r.id === roundId);
  const feedback = currentRound?.feedbackText ?? undefined;

  const draft = await generatePossibilitiesOpenAI({
    diagnosticInput,
    entradaEconomica,
    feedback,
    rejectedTitles,
    territoriosJaTentados,
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
  papeisSeletivosTrocar: string[] | null,
): Promise<void> {
  const draft = rascunhoRaw as unknown as GeneratorDraft | null;
  if (!draft) {
    throw new Error("Round em VALIDANDO sem rascunhoAtual.");
  }

  const diagnostic = await db.diagnostic.findUniqueOrThrow({ where: { id: diagnosticId } });
  const diagnosticInput = await buildDiagnosticInputCompleto(diagnostic);
  const entradaEconomica = buildEntradaEconomica(diagnostic);
  const entradaTexto = buildEntradaTexto(diagnosticInput, entradaEconomica);

  const auditoria = await auditPossibilitiesOpenAI({
    entrada: entradaTexto,
    rascunho: draft,
    tentativa: correcaoTentada ? 2 : 1,
  });

  // Ajuste seletivo: nenhum papel fora dos marcados pela própria pessoa pode
  // ser substituído, nem por sugestão do auditor — defesa em profundidade,
  // já que uma possibilidade mantida pode ter um Plano de verdade atrelado.
  // Qualquer ordem fora da lista permitida é forçada de volta pra "manter".
  if (papeisSeletivosTrocar && papeisSeletivosTrocar.length > 0) {
    const papeisSnakePermitidos = new Set(papeisSeletivosTrocar.map((p) => ROLE_MAP_INVERSO[p]));
    const ordensPermitidas = new Set(
      draft.possibilidades.filter((p) => papeisSnakePermitidos.has(p.papel)).map((p) => p.ordem),
    );
    const substituirFiltrado = auditoria.substituir.filter((ordem) => ordensPermitidas.has(ordem));
    if (substituirFiltrado.length !== auditoria.substituir.length) {
      await logDebugError(
        "run-generation-pipeline:ajuste-seletivo-bloqueou-auditor",
        new Error(
          `Round ${roundId}: auditor tentou substituir ordem(ns) fora do ajuste seletivo permitido — bloqueado.`,
        ),
      );
    }
    auditoria.substituir = substituirFiltrado;
    auditoria.manter = draft.possibilidades.map((p) => p.ordem).filter((ordem) => !substituirFiltrado.includes(ordem));
    auditoria.motivo = auditoria.motivo.filter((m) => substituirFiltrado.includes(m.ordem));
    auditoria.status = substituirFiltrado.length === 0 ? "aprovar" : "corrigir";
  }

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
  const diagnosticInput = await buildDiagnosticInputCompleto(diagnostic);
  const entradaEconomica = buildEntradaEconomica(diagnostic);
  const entradaTexto = buildEntradaTexto(diagnosticInput, entradaEconomica);

  const papeisSubstituir = auditoria.substituir.map((ordem) => {
    const original = draft.possibilidades.find((p) => p.ordem === ordem);
    return {
      ordem,
      papel: original?.papel ?? "",
      motivos: auditoria.motivo.find((m) => m.ordem === ordem)?.motivos ?? [],
    };
  });

  // Corrige no máximo 2 papéis por chamada — corrigir 4 de uma vez levou
  // 133s num teste real (medido direto, sem o teto da rota), estourando o
  // maxDuration=120s da invocação HTTP e travando a rodada em produção sem
  // erro nenhum (a Vercel mata a função no meio). Em lotes de 2 (~40-70s
  // medido), sobra sempre uma rodada de folga segura. Se sobrar mais que um
  // lote, esta fase se retrigger sozinha pro próximo, sem passar por
  // VALIDANDO ainda — as ainda-não-corrigidas deste ciclo entram como
  // "mantidas" só pra esta chamada, pra não colidir território com elas.
  const CORRECAO_LOTE_MAX = 2;
  const lote = papeisSubstituir.slice(0, CORRECAO_LOTE_MAX);
  const loteRestante = papeisSubstituir.slice(CORRECAO_LOTE_MAX);
  const mantidasParaLote = draft.possibilidades.filter(
    (p) => auditoria.manter.includes(p.ordem) || loteRestante.some((r) => r.ordem === p.ordem),
  );

  const correcao = await correctPossibilitiesOpenAI({
    entradaTexto,
    mantidas: mantidasParaLote,
    modo: "auditor",
    papeisSubstituir: lote,
  });

  const novoDraft = mergeCorrigidas(draft, correcao.possibilidades_corrigidas);

  if (loteRestante.length > 0) {
    const auditoriaRestante: AuditResult = {
      status: "corrigir",
      manter: [...auditoria.manter, ...lote.map((l) => l.ordem)],
      substituir: loteRestante.map((l) => l.ordem),
      motivo: auditoria.motivo.filter((m) => loteRestante.some((l) => l.ordem === m.ordem)),
    };
    const claimadoLote = await claimTransition(roundId, "CORRIGINDO", {
      rascunhoAtual: novoDraft as unknown as Prisma.InputJsonValue,
      auditoriaAtual: auditoriaRestante as unknown as Prisma.InputJsonValue,
    });
    if (!claimadoLote) return; // outra invocação concorrente já avançou esta rodada
    await triggerGenerationStep(roundId);
    return;
  }

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
    macroNicho: {
      nome: draft.macro_nicho.nome,
      explicacao: draft.macro_nicho.explicacao,
      nichoSecundario: draft.macro_nicho.nicho_secundario,
    } as unknown as Prisma.InputJsonValue,
    premissasFinanceirasGerais: draft.premissas_financeiras_gerais,
    metaFinanceiraUsada: {
      valorMensal: draft.meta_financeira_usada.valor_mensal,
      natureza: draft.meta_financeira_usada.natureza,
      prazoDesejado: draft.meta_financeira_usada.prazo_desejado,
    } as unknown as Prisma.InputJsonValue,
  });
  if (!claimed) return; // outra invocação concorrente já persistiu esta rodada

  const possibilidades = draft.possibilidades.map(mapPossibilityToGenerated);
  const possibilityCreateData = possibilidades.map((p) => ({
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
    dominioAplicacao: p.dominioAplicacao,
    mecanismoComercialClasse: p.mecanismoComercialClasse,
    profundidade: p.profundidade,
    impressaoDigital: p.impressaoDigital as unknown as Prisma.InputJsonValue,
    conexaoMundoReal: p.conexaoMundoReal as unknown as Prisma.InputJsonValue,
    trajetoriaFinanceira: p.trajetoriaFinanceira as unknown as Prisma.InputJsonValue,
    tempoDedicacao: p.tempoDedicacao as unknown as Prisma.InputJsonValue,
    analiseConvergenciaComercial: p.analiseConvergenciaComercial as unknown as Prisma.InputJsonValue,
  }));

  const roundInfo = await db.generationRound.findUniqueOrThrow({
    where: { id: roundId },
    select: { papeisSeletivosTrocar: true },
  });
  const papeisSeletivosTrocar = roundInfo.papeisSeletivosTrocar as unknown as string[] | null;

  if (papeisSeletivosTrocar && papeisSeletivosTrocar.length > 0) {
    // Ajuste seletivo: NUNCA toca nas possibilidades mantidas (uma delas pode
    // ter um Plano de verdade atrelado) — apaga e recria só os papéis
    // marcados pra troca, filtrando o create pelo mesmo critério.
    const papeisEnum = papeisSeletivosTrocar as PossibilityRole[];
    await db.possibility.deleteMany({ where: { roundId, papel: { in: papeisEnum } } });
    await db.generationRound.update({
      where: { id: roundId },
      data: {
        possibilities: {
          create: possibilityCreateData.filter((p) => papeisSeletivosTrocar.includes(p.papel)),
        },
      },
    });
  } else {
    await db.generationRound.update({
      where: { id: roundId },
      data: { possibilities: { create: possibilityCreateData } },
    });
  }

  // Sucesso desta rodada — fecha as possibilidades ainda PENDENTE de
  // qualquer OUTRA rodada do mesmo diagnóstico (substitui o antigo
  // previousRoundId/markRoundPossibilitiesRejeitadas: agora deriva tudo do
  // diagnosticId, sem precisar de opção externa passada entre fases).
  await db.possibility.updateMany({
    where: { round: { diagnosticId, id: { not: roundId } }, status: "PENDENTE" },
    data: { status: "REJEITADA" },
  });

  // O disparo da camada de apresentação de mercado NÃO acontece aqui de
  // propósito — testado em produção e descartado: quando esta mesma fase já
  // gastou tempo com correção pontual + promoção de reserva (várias
  // chamadas de IA em sequência), o after() que envolve todo este fluxo é
  // interrompido pela Vercel perto do teto de tempo antes de alcançar esta
  // linha, sem lançar erro (o processo é só encerrado). Em vez de competir
  // por esse mesmo orçamento, o disparo é inteiramente responsabilidade da
  // tela de possibilidades (MarketPresentationRetry, ver
  // diagnostico/possibilidades/[roundId]/page.tsx) — ela roda numa
  // invocação nova, sempre que alguém vê a página, sem herdar nada do tempo
  // já gasto aqui.
}
