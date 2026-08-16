"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "./actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.sent) {
    return (
      <p className="text-[15px] text-ink">
        Se houver uma conta com esse e-mail, você vai receber um link para redefinir sua senha em
        instantes. Confira também a caixa de spam.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block font-mono text-[11px] tracking-wide text-ink-muted uppercase"
        >
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-petrol"
        />
      </div>
      {state?.error ? <p className="text-sm text-role-3">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-lg bg-petrol px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-petrol-soft disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Enviar link de redefinição"}
      </button>
      <a href="/login" className="text-center text-sm font-medium text-petrol hover:underline">
        Voltar para o login
      </a>
    </form>
  );
}
