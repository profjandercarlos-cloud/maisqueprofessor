"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

const fieldLabel = "mb-1.5 block font-mono text-[11px] tracking-wide text-ink-muted uppercase";
const fieldInput =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-petrol";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signIn, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label htmlFor="email" className={fieldLabel}>
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={fieldInput}
        />
      </div>
      <div>
        <label htmlFor="password" className={fieldLabel}>
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={fieldInput}
        />
      </div>
      {state?.error ? <p className="text-sm text-role-3">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-lg bg-petrol px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-petrol-soft disabled:opacity-60"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
      <a
        href="/esqueci-senha"
        className="text-center text-sm font-medium text-petrol hover:underline"
      >
        Esqueci minha senha
      </a>
    </form>
  );
}
