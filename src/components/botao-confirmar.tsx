"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

// Botão de envio que pede confirmação antes (ações que sobrescrevem ou apagam).
// Cancelar a confirmação impede o envio; o texto de "pendente" aparece durante a ação.
export function BotaoConfirmar({
  children,
  pendingText,
  confirmacao,
  className,
  formAction,
}: {
  children: ReactNode;
  pendingText: string;
  confirmacao: string;
  className: string;
  formAction: (formData: FormData) => void;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(confirmacao)) e.preventDefault();
      }}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-70`}
    >
      {pending ? pendingText : children}
    </button>
  );
}
