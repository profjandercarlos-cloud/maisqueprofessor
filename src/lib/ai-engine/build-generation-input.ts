// Monta os campos estruturados que a Parte B1 do prompt V3 pede no objeto
// de entrada (além do texto corrido de formatDiagnosticInput) — formas de
// trabalho/criar valor/remuneração aceitas, recusas e a viabilidade
// econômica declarada (meta, prazo, públicos acessíveis).
import type { Diagnostic } from "@/generated/prisma/client";
import { deepGet } from "@/lib/wizard/deep-set";
import { getStepBySlug } from "@/lib/diagnostico/steps";

export type EntradaEconomica = {
  formasDeTrabalhoSelecionadas: string[];
  formasDeCriarValorSelecionadas: string[];
  modelosDeRemuneracaoAceitos: string[];
  recusasEPreferencias: string[];
  metaFinanceiraMensal: string | null;
  naturezaMeta: "renda_liquida" | "faturamento" | "nao_informada";
  prazoMeta: string | null;
  publicosAcessiveis: string | null;
};

function multiSelectLabels(
  rota: Diagnostic["rotaProfissional"],
  slug: string,
  answers: Record<string, unknown>,
): string[] {
  const step = getStepBySlug(slug, rota);
  if (!step || step.type !== "multi-select") return [];
  const values = deepGet(answers, step.path);
  if (!Array.isArray(values)) return [];
  return values.map((v) => step.options.find((o) => o.value === v)?.label ?? String(v));
}

// "preferências estruturais" é uma matrix (o que a pessoa prefere evitar
// ou não aceita) — só as linhas marcadas como "prefiro_evitar" ou
// "nao_aceito" viram recusas de verdade.
function recusas(rota: Diagnostic["rotaProfissional"], answers: Record<string, unknown>): string[] {
  const step = getStepBySlug("preferencias-estruturais", rota);
  if (!step || step.type !== "matrix") return [];
  const value = deepGet(answers, step.path);
  const rows = (value ?? {}) as Record<string, string>;
  return step.rows
    .filter((row) => rows[row.value] === "prefiro_evitar" || rows[row.value] === "nao_aceito")
    .map((row) => {
      const level = step.levels.find((l) => l.value === rows[row.value]);
      return `${row.label} — ${level?.label ?? ""}`;
    });
}

export function buildEntradaEconomica(
  diagnostic: Pick<Diagnostic, "rotaProfissional" | "answers">,
): EntradaEconomica {
  const answers = diagnostic.answers as Record<string, unknown>;
  const rota = diagnostic.rotaProfissional;

  const metaTexto = deepGet(answers, ["blocoEconomico", "metaFinanceiraMensal"]);
  const metaFinanceiraMensal = typeof metaTexto === "string" && metaTexto.trim() ? metaTexto.trim() : null;

  const prazoValue = deepGet(answers, ["blocoEconomico", "prazoMeta"]);
  const prazoStep = getStepBySlug("prazo-meta-financeira", rota);
  const prazoLabel =
    prazoStep && prazoStep.type === "single-select"
      ? (prazoStep.options.find((o) => o.value === prazoValue)?.label ?? null)
      : null;

  const publicosTexto = deepGet(answers, ["blocoEconomico", "publicosAcessiveis"]);
  const publicosAcessiveis =
    typeof publicosTexto === "string" && publicosTexto.trim() ? publicosTexto.trim() : null;

  return {
    formasDeTrabalhoSelecionadas: multiSelectLabels(rota, "formatos-aceitos", answers),
    formasDeCriarValorSelecionadas:
      rota === "CRIACAO_VALOR" || rota === "EXPLORACAO"
        ? multiSelectLabels(rota, "criacao-familias-preferidas", answers)
        : [],
    modelosDeRemuneracaoAceitos:
      rota === "CRIACAO_VALOR" ? multiSelectLabels(rota, "criacao-modelos-receita", answers) : [],
    recusasEPreferencias: recusas(rota, answers),
    metaFinanceiraMensal,
    // O diagnóstico não pergunta a distinção renda líquida x faturamento
    // separadamente — sempre "não informada" até isso virar uma pergunta própria.
    naturezaMeta: "nao_informada",
    prazoMeta: prazoLabel,
    publicosAcessiveis,
  };
}
