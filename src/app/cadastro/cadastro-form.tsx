"use client";

import { useActionState } from "react";
import { cadastrarGratuito } from "./actions";

const fieldLabel = "mb-1.5 block font-mono text-[11px] tracking-wide text-ink-muted uppercase";
const fieldInput =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-petrol";

export function CadastroForm() {
  const [state, formAction, pending] = useActionState(cadastrarGratuito, undefined);

  if (state?.enviado) {
    return (
      <div className="flex flex-col gap-3 text-[15px] text-ink">
        <p>
          Enviamos um link para o seu e-mail para você definir sua senha e entrar. Confira também a caixa
          de spam.
        </p>
        <p className="text-ink-muted">
          Já tem conta? Use{" "}
          <a href="/login" className="font-medium text-petrol hover:underline">
            Entrar
          </a>{" "}
          ou{" "}
          <a href="/esqueci-senha" className="font-medium text-petrol hover:underline">
            Esqueci minha senha
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="name" className={fieldLabel}>
          Nome
        </label>
        <input id="name" name="name" type="text" required autoComplete="name" className={fieldInput} />
      </div>
      <div>
        <label htmlFor="email" className={fieldLabel}>
          E-mail
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={fieldInput} />
      </div>
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Não preencha este campo</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {state?.error ? <p className="text-sm text-role-3">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Criando..." : "Criar conta gratuita"}
      </button>
      <a href="/login" className="text-center text-sm font-medium text-petrol hover:underline">
        Já tenho conta
      </a>
    </form>
  );
}
