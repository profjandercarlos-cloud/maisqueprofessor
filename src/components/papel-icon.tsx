import type { PossibilityRole } from "@/generated/prisma/client";

// Um ícone por papel (as 5 possibilidades geradas no diagnóstico) — pra
// que, olhando o topo da tela, a pessoa reconheça de longe qual delas é a
// que está ativa agora, sem precisar ler texto.
export const PAPEL_LABELS: Record<PossibilityRole, string> = {
  ONDE_JA_E_FORTE: "Onde você já é forte",
  PARA_ONDE_QUER_IR: "Pra onde você quer ir",
  O_QUE_PODE_MOBILIZAR: "O que pode mobilizar você",
  COMO_QUER_TRABALHAR_E_CRESCER: "Como quer trabalhar e crescer",
  NAO_CONSIDERADA: "A possibilidade que você não tinha considerado",
};

export function PapelIcon({ papel, className }: { papel: PossibilityRole; className?: string }) {
  const cls = className ?? "h-[18px] w-[18px] shrink-0";

  switch (papel) {
    case "ONDE_JA_E_FORTE":
      return (
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" className={cls}>
          <path d="M2 15 L7 6 L10 10 L12 7 L16 15 Z" />
        </svg>
      );
    case "PARA_ONDE_QUER_IR":
      return (
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
          <circle cx="9" cy="9" r="6.5" />
          <path d="M9 4.8 L10.4 9 L9 13.2 L7.6 9 Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "O_QUE_PODE_MOBILIZAR":
      return (
        <svg viewBox="0 0 18 18" fill="currentColor" stroke="none" className={cls}>
          <path d="M10 2 L5 10 H8.3 L7 16 L13 8 H9.7 Z" />
        </svg>
      );
    case "COMO_QUER_TRABALHAR_E_CRESCER":
      return (
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={cls}>
          <path d="M9 16 V9" />
          <path d="M9 9 C9 5.2 5.2 5 4 3 C4 7.2 6 9 9 9" />
          <path d="M9 11 C9 7.8 12.8 8 14 6 C14 10.2 11.8 11 9 11" />
        </svg>
      );
    case "NAO_CONSIDERADA":
      return (
        <svg viewBox="0 0 18 18" fill="currentColor" stroke="none" className={cls}>
          <path d="M9 2 L10.3 7.7 L16 9 L10.3 10.3 L9 16 L7.7 10.3 L2 9 L7.7 7.7 Z" />
        </svg>
      );
  }
}
