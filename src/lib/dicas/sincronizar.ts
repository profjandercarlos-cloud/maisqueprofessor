// Compara as dicas iniciais do arquivo com as já gravadas no banco, para o app gravar as que faltam e
// atualizar as que foram reescritas. Puro, para testar.
import type { DicaInicial } from "./iniciais";

export type DicaGravada = {
  chave: string;
  categoria: string;
  titulo: string;
  texto: string;
  tenteHoje: string;
  ideia: string | null;
};

export function diferencasDoBancoInicial(
  iniciais: DicaInicial[],
  gravadas: DicaGravada[],
): { novas: DicaInicial[]; mudadas: DicaInicial[] } {
  const porChave = new Map(gravadas.map((g) => [g.chave, g]));
  const novas: DicaInicial[] = [];
  const mudadas: DicaInicial[] = [];
  for (const d of iniciais) {
    const g = porChave.get(d.chave);
    if (!g) {
      novas.push(d);
    } else if (
      g.categoria !== d.categoria ||
      g.titulo !== d.titulo ||
      g.texto !== d.texto ||
      g.tenteHoje !== d.tenteHoje ||
      (g.ideia ?? null) !== (d.ideia ?? null)
    ) {
      mudadas.push(d);
    }
  }
  return { novas, mudadas };
}
