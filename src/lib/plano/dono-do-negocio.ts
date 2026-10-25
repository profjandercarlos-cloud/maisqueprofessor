// De quem é o negócio. Os que vieram do gerador pertencem ao dono do diagnóstico da
// rodada; os que vieram de um favorito guardam o userId direto (roundId é nulo).
export function donoDoNegocio(p: {
  userId: string | null;
  round: { diagnostic: { userId: string } } | null;
}): string | null {
  return p.userId ?? p.round?.diagnostic.userId ?? null;
}
