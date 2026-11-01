// Temas das dicas da lista de presença. O id é o que fica gravado no banco.
export const CATEGORIAS_DICAS = [
  { id: "comecar", nome: "Começar pequeno" },
  { id: "atrito", nome: "Ambiente e atrito" },
  { id: "foco", nome: "Foco e energia" },
  { id: "recomecar", nome: "Recomeçar" },
  { id: "medo", nome: "Medo de vender e de rejeição" },
  { id: "validar", nome: "Validar antes de construir" },
  { id: "preco", nome: "Precificar e cobrar" },
  { id: "constancia", nome: "Constância sem culpa" },
] as const;

export type CategoriaDica = (typeof CATEGORIAS_DICAS)[number]["id"];

export const IDS_DAS_CATEGORIAS: string[] = CATEGORIAS_DICAS.map((c) => c.id);

export function nomeDaCategoria(id: string): string {
  return CATEGORIAS_DICAS.find((c) => c.id === id)?.nome ?? id;
}
