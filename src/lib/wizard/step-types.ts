// Tipos de "step" compartilhados pelos dois questionários wizard do app
// (descoberta e adequação da execução) — uma pergunta por tela, com
// autosave por step via server action.

export type StepOption = { value: string; label: string };

export type WizardStep =
  | {
      slug: string;
      block: number;
      type: "intention";
      question: string;
      options: StepOption[];
    }
  | {
      slug: string;
      block: number;
      type: "textarea";
      question: string;
      helper?: string;
      placeholder?: string;
      optional?: boolean;
      allowSkipWithCheckbox?: string; // rótulo de um checkbox que dispensa o mínimo de caracteres (ex.: "Não tive experiências...")
      minChars?: number;
      maxChars?: number;
      path: string[];
    }
  | {
      slug: string;
      block: number;
      type: "number";
      question: string;
      helper?: string;
      min: number;
      max: number;
      step: number;
      defaultValue: number;
      path: string[];
    }
  | {
      slug: string;
      block: number;
      type: "single-select";
      question: string;
      helper?: string;
      options: StepOption[];
      allowOther?: boolean;
      path: string[];
    }
  | {
      slug: string;
      block: number;
      type: "multi-select";
      question: string;
      helper?: string;
      options: StepOption[];
      minSelect?: number;
      maxSelect?: number;
      allowOther?: boolean;
      path: string[];
    }
  | {
      slug: string;
      block: number;
      type: "situation";
      question: string;
      helper?: string;
      fields: { key: string; label: string; minChars?: number; maxChars?: number }[];
      rejectIfSameAs?: string[]; // path de outra situação — rejeita se o texto normalizado for idêntico
      path: string[];
    }
  | {
      slug: string;
      block: number;
      type: "matrix";
      question: string;
      helper?: string;
      rows: StepOption[];
      levels: StepOption[];
      path: string[];
    };

// Path irmão usado pro campo de texto complementar de "Outro", quando
// allowOther está ligado num select — ex.: ["bloco4","tipoDeProblema"] vira
// ["bloco4","tipoDeProblemaOutroDetalhe"].
export function otherDetailPath(path: string[]): string[] {
  const last = path[path.length - 1];
  return [...path.slice(0, -1), `${last}OutroDetalhe`];
}
