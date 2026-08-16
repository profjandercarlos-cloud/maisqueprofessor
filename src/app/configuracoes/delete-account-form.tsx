"use client";

import { useState } from "react";
import { deleteAccount } from "./actions";

export function DeleteAccountForm({ email, error }: { email: string; error?: string }) {
  const [confirming, setConfirming] = useState(false);
  const [typedEmail, setTypedEmail] = useState("");
  const matches = typedEmail.trim().toLowerCase() === email.toLowerCase();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-[13.5px] font-semibold text-role-3 hover:underline"
      >
        Excluir minha conta
      </button>
    );
  }

  return (
    <form action={deleteAccount} className="flex flex-col gap-3 rounded-lg border border-role-3 p-4">
      <p className="text-[13.5px] text-ink">
        Isso apaga permanentemente sua conta, diagnósticos, planos e diário. Não tem como desfazer.
        Para confirmar, digite seu e-mail (<strong>{email}</strong>) abaixo.
      </p>
      <input
        type="text"
        name="confirmation"
        value={typedEmail}
        onChange={(e) => setTypedEmail(e.target.value)}
        placeholder={email}
        className="w-full rounded-lg border border-line bg-paper px-3.5 py-2 text-[14px] text-ink outline-none focus:border-role-3"
      />
      {error ? <p className="text-sm text-role-3">{error}</p> : null}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!matches}
          className="rounded-lg bg-role-3 px-4 py-2 text-[13px] font-semibold text-paper disabled:cursor-not-allowed disabled:opacity-40"
        >
          Excluir permanentemente
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-[13px] font-medium text-ink-muted hover:text-ink"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
