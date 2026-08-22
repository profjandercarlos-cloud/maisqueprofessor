"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

// Chamadas de IA (gerar possibilidades, gerar plano) levam de 15s a mais de
// 1 minuto — sem isso, o botão fica parado e parece travado, e a tentação
// de recarregar a página no meio da geração é real (foi o que gerou o erro
// reportado em teste: a pessoa recarrega, a resposta em andamento é
// cortada, e aparece uma tela de erro genérica).
export function SubmitButton({
  children,
  pendingText,
  className,
}: {
  children: ReactNode;
  pendingText: string;
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={`${className} disabled:cursor-not-allowed disabled:opacity-70`}>
      {pending ? pendingText : children}
    </button>
  );
}
