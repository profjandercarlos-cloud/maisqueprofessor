"use client";

import { useEffect, useRef, useState } from "react";

// O erro vem de um parâmetro de URL (?error=...) fixado no carregamento da
// página — ele não se atualiza sozinho conforme a pessoa edita os campos.
// Sem isso, alguém podia corrigir o campo (ex.: completar o mínimo de
// caracteres) e continuar vendo a mensagem antiga, achando que a correção
// não "pegou" quando na verdade só precisava enviar de novo.
export function StepErrorBanner({ error }: { error: string }) {
  const [dismissed, setDismissed] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const handle = () => setDismissed(true);
    form.addEventListener("input", handle);
    form.addEventListener("change", handle);
    return () => {
      form.removeEventListener("input", handle);
      form.removeEventListener("change", handle);
    };
  }, []);

  if (dismissed) return null;
  return (
    <p ref={ref} className="text-sm text-role-3">
      {error}
    </p>
  );
}
