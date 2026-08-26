"use client";

import { useState } from "react";

// Mostra o mínimo/máximo de caracteres de forma proativa, atualizando ao
// digitar — antes, essa exigência só aparecia depois de um erro de envio,
// o que fazia a pessoa descobrir a regra tarde demais.
export function CharCounterTextarea({
  name,
  id,
  defaultValue,
  placeholder,
  required,
  disabled,
  minChars,
  maxChars,
  className,
}: {
  name: string;
  id?: string;
  defaultValue: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minChars?: number;
  maxChars?: number;
  className: string;
}) {
  const [length, setLength] = useState(defaultValue.length);
  const belowMin = minChars !== undefined && length < minChars;
  const aboveMax = maxChars !== undefined && length > maxChars;

  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        id={id}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={className}
        onChange={(e) => setLength(e.target.value.length)}
      />
      {(minChars || maxChars) && !disabled ? (
        <p className={`text-[12px] ${belowMin || aboveMax ? "text-role-3" : "text-ink-muted"}`}>
          {length} caracteres
          {minChars ? ` · mínimo ${minChars}` : ""}
          {maxChars ? ` · máximo ${maxChars}` : ""}
        </p>
      ) : null}
    </div>
  );
}
