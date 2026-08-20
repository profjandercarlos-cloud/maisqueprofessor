"use client";

import { useActionState } from "react";
import { PasswordInput } from "@/components/password-input";
import { setNewPassword } from "./actions";

const fieldLabel = "mb-1.5 block font-mono text-[11px] tracking-wide text-ink-muted uppercase";
const fieldInput =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-petrol";

export function SetPasswordForm() {
  const [state, formAction, pending] = useActionState(setNewPassword, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="password" className={fieldLabel}>
          Nova senha
        </label>
        <PasswordInput
          id="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={fieldInput}
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className={fieldLabel}>
          Confirmar senha
        </label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          required
          minLength={8}
          autoComplete="new-password"
          className={fieldInput}
        />
      </div>
      {state?.error ? <p className="text-sm text-role-3">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-lg bg-petrol px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-petrol-soft disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar e entrar"}
      </button>
    </form>
  );
}
