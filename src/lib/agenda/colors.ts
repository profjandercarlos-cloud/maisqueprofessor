// Paleta fixa — a pessoa escolhe entre essas cores ao criar uma entrada,
// nunca um seletor livre. Cores pensadas pra conviver com o petrol/gold do
// app e continuar legíveis nos dois temas (claro/escuro).
export const AGENDA_COLORS: { token: string; label: string; hex: string }[] = [
  { token: "petrol", label: "Petróleo", hex: "#1b3a3a" },
  { token: "gold", label: "Dourado", hex: "#c9a659" },
  { token: "azul", label: "Azul", hex: "#3b6ea5" },
  { token: "verde", label: "Verde", hex: "#4c8c5c" },
  { token: "roxo", label: "Roxo", hex: "#7a5ca8" },
  { token: "vermelho", label: "Vermelho", hex: "#b0503f" },
  { token: "laranja", label: "Laranja", hex: "#c97a3d" },
  { token: "rosa", label: "Rosa", hex: "#b56591" },
  { token: "turquesa", label: "Turquesa", hex: "#3a9494" },
  { token: "cinza", label: "Cinza", hex: "#6b6b63" },
];

export const AGENDA_COLOR_MAP: Record<string, string> = Object.fromEntries(
  AGENDA_COLORS.map((c) => [c.token, c.hex]),
);

export const DEFAULT_AGENDA_COLOR = AGENDA_COLORS[0].token;
