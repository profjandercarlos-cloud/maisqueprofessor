import { LEVEL_COLORS, type Level } from "@/lib/plano/evolucao";

export function Medal({ level, size = 40 }: { level: Level; size?: number }) {
  const earned = level !== "iniciando";
  const color = LEVEL_COLORS[level];
  const height = Math.round(size * (56 / 48));
  return (
    <svg viewBox="0 0 48 56" width={size} height={height} aria-hidden>
      <path
        d="M14 4 L24 22 L34 4"
        fill="none"
        stroke={earned ? color : "var(--line)"}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <circle
        cx="24"
        cy="34"
        r="17"
        fill={earned ? color : "var(--paper)"}
        stroke={earned ? color : "var(--line)"}
        strokeWidth="2"
      />
      <path
        d="M24 25 L26.5 31 L33 31.5 L28 35.7 L29.5 42 L24 38.5 L18.5 42 L20 35.7 L15 31.5 L21.5 31 Z"
        fill={earned ? "var(--paper)" : "var(--line)"}
      />
    </svg>
  );
}
