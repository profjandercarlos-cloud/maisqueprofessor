import type { Diagnostic } from "@/generated/prisma/client";
import { deepGet } from "@/lib/wizard/deep-set";
import { otherDetailPath, type WizardStep } from "@/lib/wizard/step-types";
import { getStepsForRoute } from "@/lib/diagnostico/steps";

const BLOCK_TITLES: Record<number, string> = {
  1: "DIREÇÃO DA BUSCA",
  2: "EVIDÊNCIAS REAIS",
  3: "INTERESSES E MOBILIZAÇÃO",
  4: "FUTURO PROFISSIONAL",
  5: "BLOCO CONDICIONAL DA ROTA ESCOLHIDA",
};

const INTENTION_LABELS: Record<string, string> = {
  SAIR: "Quero construir uma saída da sala de aula.",
  COMPLEMENTAR: "Quero continuar na educação, mas desenvolver outra atividade.",
  NAO_SEI: "Ainda não sei se quero sair.",
  JA_FORA_DA_SALA: "Já estou fora da sala de aula e quero encontrar uma nova direção.",
};

const ROTA_LABELS: Record<string, string> = {
  CARREIRA: "Nova carreira — profissão, função, setor ou ambiente de trabalho reconhecível.",
  CRIACAO_VALOR: "Nova forma de atuação — serviços, produtos, ferramentas, conteúdo ou negócio.",
  EXPLORACAO: "Exploração equilibrada — ainda não decidiu entre carreira e criação de valor.",
};

const SEM_RESPOSTA = "não informado";
const SKIP_SENTINEL = "__SEM_RESPOSTA__";

function formatAnswer(step: WizardStep, answers: Record<string, unknown>): string {
  if (step.type === "intention") return "";

  const value = deepGet(answers, step.path);

  switch (step.type) {
    case "textarea": {
      if (value === SKIP_SENTINEL) return "não teve / não se aplica (confirmado pela pessoa)";
      const text = typeof value === "string" ? value.trim() : "";
      return text || SEM_RESPOSTA;
    }
    case "number": {
      return typeof value === "number" ? String(value) : SEM_RESPOSTA;
    }
    case "single-select": {
      const opt = step.options.find((o) => o.value === value);
      let label = opt?.label ?? SEM_RESPOSTA;
      if (step.allowOther && value === "outro") {
        const detail = deepGet(answers, otherDetailPath(step.path));
        if (typeof detail === "string" && detail.trim()) label += ` (${detail.trim()})`;
      }
      return label;
    }
    case "multi-select": {
      const values = Array.isArray(value) ? (value as string[]) : [];
      if (values.length === 0) return SEM_RESPOSTA;
      let label = values.map((v) => step.options.find((o) => o.value === v)?.label ?? v).join("; ");
      if (step.allowOther && values.includes("outro")) {
        const detail = deepGet(answers, otherDetailPath(step.path));
        if (typeof detail === "string" && detail.trim()) label += ` (Outro: ${detail.trim()})`;
      }
      return label;
    }
    case "situation": {
      const fields = (value ?? {}) as Record<string, string>;
      return step.fields.map((f) => `  - ${f.label} ${fields[f.key] || SEM_RESPOSTA}`).join("\n");
    }
    case "matrix": {
      const rows = (value ?? {}) as Record<string, string>;
      return step.rows
        .map((row) => {
          const level = step.levels.find((l) => l.value === rows[row.value]);
          return `  - ${row.label}: ${level?.label ?? SEM_RESPOSTA}`;
        })
        .join("\n");
    }
    default:
      return SEM_RESPOSTA;
  }
}

// Monta a mensagem de usuário legível que o motor de IA recebe — formato
// sugerido em Questionario_Descoberta_Unificado_MaisQueProfessor.docx.
export function formatDiagnosticInput(
  diagnostic: Pick<Diagnostic, "intention" | "rotaProfissional" | "answers">,
) {
  const answers = diagnostic.answers as Record<string, unknown>;
  const rota = diagnostic.rotaProfissional;
  const lines: string[] = [`INTENÇÃO DECLARADA: ${INTENTION_LABELS[diagnostic.intention]}`];

  if (rota) {
    lines.push(`ROTA PROFISSIONAL ESCOLHIDA: ${ROTA_LABELS[rota]}`);
  }

  let currentBlock = 0;
  for (const step of getStepsForRoute(rota)) {
    if (step.type === "intention") continue;

    if (step.block !== currentBlock) {
      currentBlock = step.block;
      lines.push("", `BLOCO ${currentBlock} — ${BLOCK_TITLES[currentBlock]}`);
    }

    const answer = formatAnswer(step, answers);
    if (step.type === "situation" || step.type === "matrix") {
      lines.push(step.question);
      lines.push(answer);
    } else {
      lines.push(`${step.question} ${answer}`);
    }
  }

  return lines.join("\n");
}
