// Testes mínimos da fila de geração V4 — concorrência (reivindicação
// atômica ANTES da chamada de IA), limite de uma correção direcionada,
// retomada de uma fase abandonada, e isolamento entre usuários na Server
// Action de retomada. Rodam contra o banco real (mesmo `db` de produção),
// sempre em linhas descartáveis criadas e apagadas por este arquivo —
// nunca tocam nenhuma conta real. As chamadas de IA são todas mockadas:
// não gastam nem dependem da OpenAI.
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import type { PossibilityRole } from "@/generated/prisma/client";

vi.mock("./generate-possibilities-openai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./generate-possibilities-openai")>();
  return { ...actual, generatePossibilitiesOpenAI: vi.fn() };
});
vi.mock("./audit-possibilities-openai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./audit-possibilities-openai")>();
  return { ...actual, auditPossibilitiesOpenAI: vi.fn() };
});
vi.mock("./correct-possibilities-openai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./correct-possibilities-openai")>();
  return { ...actual, correctPossibilitiesOpenAI: vi.fn() };
});
vi.mock("./trigger-generation-step", () => ({ triggerGenerationStep: vi.fn() }));
vi.mock("@/lib/auth/require-active-access", () => ({ requireActiveAccess: vi.fn() }));

import { generatePossibilitiesOpenAI } from "./generate-possibilities-openai";
import { auditPossibilitiesOpenAI } from "./audit-possibilities-openai";
import { correctPossibilitiesOpenAI } from "./correct-possibilities-openai";
import { triggerGenerationStep } from "./trigger-generation-step";
import { requireActiveAccess } from "@/lib/auth/require-active-access";
import { runGenerationStep, claimPhase, CLAIM_TIMEOUT_MS } from "./run-generation-pipeline";
import { retryGenerationStep } from "../../app/diagnostico/possibilidades/[roundId]/retry-actions";

const ROLES: PossibilityRole[] = [
  "ONDE_JA_E_FORTE",
  "PARA_ONDE_QUER_IR",
  "O_QUE_PODE_MOBILIZAR",
  "NAO_CONSIDERADA",
  "MAIOR_CONVERGENCIA_COMERCIAL",
];
const ROLE_SNAKE: Record<PossibilityRole, string> = {
  ONDE_JA_E_FORTE: "onde_ja_e_forte",
  PARA_ONDE_QUER_IR: "para_onde_quer_ir",
  O_QUE_PODE_MOBILIZAR: "o_que_pode_mobilizar",
  NAO_CONSIDERADA: "nao_considerada",
  // Enum do banco continua MAIOR_CONVERGENCIA_COMERCIAL (evita migração) —
  // só o rótulo snake_case do JSON do gerador mudou pro V5 "macro nicho".
  MAIOR_CONVERGENCIA_COMERCIAL: "maior_chance_sucesso_financeiro",
} as Record<PossibilityRole, string>;

const MARCO_TEMPORAL_TESTE = { premissas: "Premissas de teste.", resultado_liquido_estimado: "R$ 1.000" };

function buildMockPossibility(ordem: number, papel: PossibilityRole) {
  const destaque = papel === "MAIOR_CONVERGENCIA_COMERCIAL";
  return {
    ordem,
    papel: ROLE_SNAKE[papel],
    rotulo_papel: papel,
    destaque,
    titulo: `Possibilidade de teste ${ordem}`,
    subtitulo: "Subtítulo de teste com palavras suficientes pra passar na validação de tamanho mínimo.",
    base_no_historico: "moderada",
    tempo_primeira_validacao: "curto_prazo",
    horizonte_relevancia_financeira: destaque ? "medio_prazo" : "curto_prazo",
    a_possibilidade: "Texto de teste. ".repeat(6),
    por_que_combina_com_voce: "Texto de teste. ".repeat(5),
    como_gerar_receita: "Texto de teste. ".repeat(6),
    como_validar: "Texto de teste. ".repeat(5),
    ponto_de_atencao: "Texto de teste breve.",
    dominio_aplicacao: "domínio de teste",
    mecanismo_comercial_classe: "servico_projeto",
    profundidade: "diagnostico_pontual",
    impressao_digital: {
      papel: ROLE_SNAKE[papel],
      territorio: `território ${ordem}`,
      problema: "problema de teste",
      publico: "público de teste",
      pagador: "pagador de teste",
      entrega: "entrega de teste",
      modelo_receita: "projeto",
      evidencias: ["[teste-slug]"],
      risco_principal: "risco de teste",
      confianca_comercial: "moderada",
    },
    conexao_mundo_real: {
      nome_de_mercado: "mercado de teste",
      reconhecimento_mercado: "Reconhecimento de teste.",
      compradores_nomeados: ["comprador de teste"],
    },
    trajetoria_financeira: {
      cenario_inicial: MARCO_TEMPORAL_TESTE,
      ano_1: MARCO_TEMPORAL_TESTE,
      ano_3: MARCO_TEMPORAL_TESTE,
      ano_5: MARCO_TEMPORAL_TESTE,
      logica_de_crescimento: "Lógica de teste.",
      risco_estrutural: "Risco estrutural de teste.",
      aviso: "Hipótese de referência, não previsão.",
    },
    tempo_dedicacao: { inicial: "10h/semana", ano_3: "20h/semana", ano_5: "20h/semana" },
    analise_convergencia_comercial: null,
  };
}

function buildMockDraft() {
  return {
    versao_motor: "v5-teste",
    macro_nicho: { nome: "Nicho de teste", explicacao: "Explicação de teste.", nicho_secundario: null },
    premissas_financeiras_gerais: "Premissas gerais de teste.",
    meta_financeira_usada: { valor_mensal: null, natureza: "nao_informada", prazo_desejado: null },
    possibilidades: ROLES.map((papel, i) => buildMockPossibility(i + 1, papel)),
    reservas: ROLES.map((papel, i) => ({
      papel: ROLE_SNAKE[papel],
      territorio: `território reserva ${i + 1}`,
      problema: "problema reserva",
      publico: "público reserva",
      pagador: "pagador reserva",
      entrega: "entrega reserva",
      modelo_receita: "projeto",
      motivo_reserva: "motivo de teste",
    })),
    aviso_economico: "Aviso de teste.",
  };
}

// Cria diagnóstico + usuário totalmente descartáveis — nunca toca nenhuma
// conta real. answers vazio é seguro: format-diagnostic-input.ts e
// build-generation-input.ts tratam ausência de resposta graciosamente.
async function createDisposableDiagnostic() {
  const userId = randomUUID();
  const email = `vitest-${randomUUID()}@example.invalid`;
  await db.user.create({ data: { id: userId, name: "Usuário de teste", email } });
  const diagnostic = await db.diagnostic.create({
    data: { userId, intention: "SAIR", status: "CONCLUIDO", answers: {} },
  });
  return { userId, diagnosticId: diagnostic.id };
}

async function cleanupUser(userId: string) {
  // Cascade cuida de Diagnostic → GenerationRound → Possibility.
  await db.user.delete({ where: { id: userId } }).catch(() => {});
}

describe("run-generation-pipeline — concorrência e limites", () => {
  const createdUserIds: string[] = [];

  afterEach(async () => {
    vi.clearAllMocks();
    await Promise.all(createdUserIds.splice(0).map(cleanupUser));
  });

  it("reivindica a fase ANTES de chamar a IA — duas invocações paralelas geram só 1 chamada e 1 persistência", async () => {
    const { userId, diagnosticId } = await createDisposableDiagnostic();
    createdUserIds.push(userId);

    const round = await db.generationRound.create({
      data: { diagnosticId, roundNumber: 1, status: "PENDENTE" },
    });

    let resolveGenerate!: (v: unknown) => void;
    const generatePromise = new Promise((resolve) => {
      resolveGenerate = resolve;
    });
    vi.mocked(generatePossibilitiesOpenAI).mockImplementation(async () => {
      // Mantém a chamada "em voo" até as duas invocações já terem sido
      // disparadas, simulando uma chamada de IA real em andamento — é
      // exatamente essa janela que permitiria uma 2ª invocação concorrente
      // tentar chamar a IA de novo se a reivindicação não fosse atômica.
      await generatePromise;
      return buildMockDraft() as never;
    });

    const call1 = runGenerationStep(round.id);
    const call2 = runGenerationStep(round.id);
    // Dá tempo das duas invocações lerem o status e disputarem a
    // reivindicação antes de destravar a chamada de IA mockada.
    await new Promise((r) => setTimeout(r, 50));
    resolveGenerate(undefined);
    await Promise.all([call1, call2]);

    expect(generatePossibilitiesOpenAI).toHaveBeenCalledTimes(1);

    const finalRound = await db.generationRound.findUniqueOrThrow({ where: { id: round.id } });
    expect(finalRound.status).toBe("VALIDANDO");
    expect(finalRound.rascunhoAtual).not.toBeNull();
  });

  it("no máximo 1 correção direcionada — se a verificação final reprovar de novo, promove reserva e nunca reabre CORRIGINDO uma 2ª vez", async () => {
    const { userId, diagnosticId } = await createDisposableDiagnostic();
    createdUserIds.push(userId);

    const round = await db.generationRound.create({
      data: { diagnosticId, roundNumber: 1, status: "PENDENTE" },
    });

    vi.mocked(generatePossibilitiesOpenAI).mockResolvedValue(buildMockDraft() as never);
    // O auditor SEMPRE pede correção do papel 4 — testa que isso nunca gera
    // um 2º ciclo de CORRIGINDO, só a promoção de reserva no final.
    vi.mocked(auditPossibilitiesOpenAI).mockResolvedValue({
      status: "corrigir",
      manter: [1, 2, 3, 5],
      substituir: [4],
      motivo: [{ ordem: 4, motivos: ["motivo de teste — sempre reprova"] }],
    } as never);
    vi.mocked(correctPossibilitiesOpenAI).mockImplementation(async (params: unknown) => {
      const p = params as { modo: string };
      const corrigida = buildMockPossibility(4, "NAO_CONSIDERADA");
      return { possibilidades_corrigidas: p.modo === "reserva" ? [corrigida] : [corrigida] } as never;
    });

    // Dispara e segue manualmente a fila (triggerGenerationStep está
    // mockado como no-op) até chegar a um status terminal.
    let status = "PENDENTE";
    for (let i = 0; i < 8 && status !== "CONCLUIDO" && status !== "FALHOU"; i++) {
      await runGenerationStep(round.id);
      status = (await db.generationRound.findUniqueOrThrow({ where: { id: round.id } })).status;
    }

    expect(status).toBe("CONCLUIDO");
    // 1ª auditoria (reprova) + verificação final (reprova de novo) — nunca
    // uma 3ª chamada, porque a 2ª reprovação vai direto pra promoção de
    // reserva, não para mais uma rodada de CORRIGINDO.
    expect(auditPossibilitiesOpenAI).toHaveBeenCalledTimes(2);
    // 1 correção guiada pelo auditor + 1 promoção de reserva (mesma ordem 4).
    expect(correctPossibilitiesOpenAI).toHaveBeenCalledTimes(2);

    const finalRound = await db.generationRound.findUniqueOrThrow({
      where: { id: round.id },
      include: { possibilities: true },
    });
    expect(finalRound.correcaoTentada).toBe(true);
    expect(finalRound.possibilities).toHaveLength(5);
  });

  it("retomada de fase abandonada — claimPhase recusa reivindicar um lock recente, mas aceita um lock expirado", async () => {
    const { userId, diagnosticId } = await createDisposableDiagnostic();
    createdUserIds.push(userId);

    const round = await db.generationRound.create({
      data: { diagnosticId, roundNumber: 1, status: "PENDENTE" },
    });

    // Lock recente (fase legitimamente em andamento) — não pode ser
    // reivindicado de novo.
    await db.generationRound.update({ where: { id: round.id }, data: { claimedAt: new Date() } });
    expect(await claimPhase(round.id, "PENDENTE")).toBe(false);

    // Lock mais velho que CLAIM_TIMEOUT_MS (invocação abandonada/morta) —
    // pode ser reivindicado de novo, permitindo retomar o trabalho.
    await db.generationRound.update({
      where: { id: round.id },
      data: { claimedAt: new Date(Date.now() - CLAIM_TIMEOUT_MS - 1000) },
    });
    expect(await claimPhase(round.id, "PENDENTE")).toBe(true);
  });

  it("isolamento entre usuários — retryGenerationStep nunca age sobre uma rodada de outro usuário", async () => {
    const ownerFixture = await createDisposableDiagnostic();
    const strangerFixture = await createDisposableDiagnostic();
    createdUserIds.push(ownerFixture.userId, strangerFixture.userId);

    const round = await db.generationRound.create({
      data: { diagnosticId: ownerFixture.diagnosticId, roundNumber: 1, status: "PENDENTE" },
    });

    // Chamando como o usuário ERRADO (não dono da rodada) — não pode
    // disparar nada, mesmo autenticado com sucesso.
    vi.mocked(requireActiveAccess).mockResolvedValueOnce({ id: strangerFixture.userId } as never);
    await retryGenerationStep(round.id);
    expect(triggerGenerationStep).not.toHaveBeenCalled();

    // Mesma rodada, agora chamando como o dono de verdade — deve disparar.
    vi.mocked(requireActiveAccess).mockResolvedValueOnce({ id: ownerFixture.userId } as never);
    await retryGenerationStep(round.id);
    expect(triggerGenerationStep).toHaveBeenCalledTimes(1);
    expect(triggerGenerationStep).toHaveBeenCalledWith(round.id);
  });
});
