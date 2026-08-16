import type { Diagnostic } from "@/generated/prisma/client";
import { deepGet } from "@/lib/diagnostico/deep-set";
import { DIAGNOSTIC_STEPS, type DiagnosticStep } from "@/lib/diagnostico/steps";

const BLOCK_TITLES: Record<number, string> = {
  1: "ALÉM DO CARGO",
  2: "EVIDÊNCIAS REAIS",
  3: "SEU MODO DE AGIR",
  4: "PROBLEMAS E CONTRIBUIÇÃO",
  5: "INTERESSES E APRENDIZAGEM",
  6: "A VIDA PROFISSIONAL DESEJADA",
  7: "LIMITES E RECUSAS",
};

const INTENTION_LABELS: Record<string, string> = {
  SAIR: "Quero sair da sala de aula",
  COMPLEMENTAR: "Quero continuar na educação, mas com uma atividade complementar",
  NAO_SEI: "Ainda não sei — quero enxergar as possibilidades primeiro",
};

function formatAnswer(step: DiagnosticStep, answers: Record<string, unknown>): string {
  if (step.type === "intention") return "";

  const value = deepGet(answers, step.path);

  switch (step.type) {
    case "textarea": {
      const text = typeof value === "string" ? value.trim() : "";
      return text || "não informado";
    }
    case "single-select": {
      const opt = step.options.find((o) => o.value === value);
      return opt?.label ?? "não informado";
    }
    case "multi-select": {
      const values = Array.isArray(value) ? (value as string[]) : [];
      if (values.length === 0) return "não informado";
      return values
        .map((v) => step.options.find((o) => o.value === v)?.label ?? v)
        .join("; ");
    }
    case "situation": {
      const fields = (value ?? {}) as Record<string, string>;
      return step.fields.map((f) => `  - ${f.label} ${fields[f.key] || "não informado"}`).join("\n");
    }
    case "matrix": {
      const rows = (value ?? {}) as Record<string, string>;
      return step.rows
        .map((row) => {
          const level = step.levels.find((l) => l.value === rows[row.value]);
          return `  - ${row.label}: ${level?.label ?? "não informado"}`;
        })
        .join("\n");
    }
    default:
      return "não informado";
  }
}

// Monta a mensagem de usuário legível que o motor de IA recebe — formato
// sugerido em Motor_IA_Geracao_5_Possibilidades.md.
export function formatDiagnosticInput(diagnostic: Pick<Diagnostic, "intention" | "answers">) {
  const answers = diagnostic.answers as Record<string, unknown>;
  const lines: string[] = [`INTENÇÃO DECLARADA: ${INTENTION_LABELS[diagnostic.intention]}`];

  let currentBlock = 0;
  for (const step of DIAGNOSTIC_STEPS) {
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
