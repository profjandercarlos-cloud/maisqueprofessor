import type { ReactNode } from "react";
import type { PossibilityRole } from "@/generated/prisma/client";

export const ROLE_ORDER: PossibilityRole[] = [
  "ONDE_JA_E_FORTE",
  "PARA_ONDE_QUER_IR",
  "O_QUE_PODE_MOBILIZAR",
  "NAO_CONSIDERADA",
  "MAIOR_CONVERGENCIA_COMERCIAL",
];

export const ROLE_META: Record<
  PossibilityRole,
  { label: string; subtitle: string; accentVar: string; icon: ReactNode }
> = {
  ONDE_JA_E_FORTE: {
    label: "Onde você já é forte",
    subtitle: "Onde aquilo que você já demonstrou fazer bem teria maior valor.",
    accentVar: "var(--role-1)",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 2l2 5.5L17.5 9 12 12l1 5.5L10 15l-3 2.5 1-5.5L2.5 9 8 7.5 10 2z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  PARA_ONDE_QUER_IR: {
    label: "Para onde você quer ir",
    subtitle: "Qual possibilidade leva melhor à direção que você declarou.",
    accentVar: "var(--role-2)",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path
          d="M4 16L16 4M16 4H8M16 4v8"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  O_QUE_PODE_MOBILIZAR: {
    label: "O que pode mobilizar você",
    subtitle: "O que conversa com sua curiosidade, energia e senso de contribuição.",
    accentVar: "var(--role-3)",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 2c1 3-2 4-2 7a3 3 0 106 0c0-1-.5-2-1-2.5.5 2-1 2.5-1 1 0-2-2.5-3-2-5.5z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  // Não é mais gerado (substituído por MAIOR_CONVERGENCIA_COMERCIAL) —
  // mantido só porque o tipo Record<PossibilityRole, ...> exige uma
  // entrada pra cada valor do enum, e remover o valor do enum no Postgres
  // exigiria recriar o tipo.
  COMO_QUER_TRABALHAR_E_CRESCER: {
    label: "Um desafio de crescimento",
    subtitle: "Uma característica sua que ainda não é habilidade, mas que o esforço poderia transformar em uma.",
    accentVar: "var(--role-4)",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="11" width="3.5" height="6" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
        <rect x="8.25" y="7" width="3.5" height="10" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
        <rect x="13.5" y="3" width="3.5" height="14" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  NAO_CONSIDERADA: {
    label: "Uma possibilidade que talvez não tenha considerado",
    subtitle: "Que contexto novo é sustentado por indícios reais do seu perfil.",
    accentVar: "var(--role-5)",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path
          d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  MAIOR_CONVERGENCIA_COMERCIAL: {
    label: "Maior chance de sucesso financeiro",
    subtitle: "No cenário de 5 anos, a que projeta o maior resultado entre as 5 — não é a mais rápida, é a de maior potencial de longo prazo.",
    accentVar: "var(--role-6)",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="2" fill="currentColor" stroke="none" />
        <path
          d="M10 1.5v3.5M10 15v3.5M18.5 10H15M5 10H1.5M15.5 4.5l-2.5 2.5M7 10.5l-2.5 2.5M15.5 15.5l-2.5-2.5M7 9.5L4.5 7"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
};
