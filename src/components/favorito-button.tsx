"use client";

import { useOptimistic, useTransition } from "react";
import { alternarFavorito } from "@/app/negocios/actions";

function Coracao({ cheio }: { cheio: boolean }) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill={cheio ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px] shrink-0"
      aria-hidden
    >
      <path d="M9 15.5s-6-3.6-6-8.1A3.4 3.4 0 019 5.6a3.4 3.4 0 016 1.8c0 4.5-6 8.1-6 8.1z" />
    </svg>
  );
}

// Coração de favoritar. Atualiza na hora (estado otimista) e grava em seguida;
// se a gravação falhar, a tela volta ao estado real quando a página revalida.
// variante "icone": só o coração (cartões); "botao": coração com texto (ficha).
export function FavoritoButton({
  codigo,
  favorito,
  variante = "icone",
}: {
  codigo: string;
  favorito: boolean;
  variante?: "icone" | "botao";
}) {
  const [otimista, setOtimista] = useOptimistic(favorito);
  const [pendente, iniciar] = useTransition();

  function alternar() {
    iniciar(async () => {
      setOtimista(!otimista);
      await alternarFavorito(codigo);
    });
  }

  const cor = otimista ? "text-role-3" : "text-ink-muted hover:text-role-3";
  const rotulo = otimista ? "Remover dos favoritos" : "Adicionar aos favoritos";

  if (variante === "botao") {
    return (
      <button
        type="button"
        onClick={alternar}
        disabled={pendente}
        aria-pressed={otimista}
        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-70 ${
          otimista ? "border-role-3 text-role-3" : "border-line text-ink hover:border-role-3 hover:text-role-3"
        }`}
      >
        <Coracao cheio={otimista} />
        {otimista ? "Nos seus favoritos" : "Favoritar"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={pendente}
      aria-pressed={otimista}
      aria-label={rotulo}
      title={rotulo}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-gold-soft disabled:opacity-70 ${cor}`}
    >
      <Coracao cheio={otimista} />
    </button>
  );
}
