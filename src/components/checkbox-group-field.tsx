"use client";

import { useState } from "react";

// Mostra o mínimo/máximo de seleções de forma proativa e trava novas
// marcações assim que o máximo é atingido — antes, o limite só aparecia
// como erro depois de tentar enviar com seleções demais.
export function CheckboxGroupField({
  options,
  defaultSelected,
  minSelect,
  maxSelect,
  optionCardClass,
}: {
  options: { value: string; label: string }[];
  defaultSelected: string[];
  minSelect?: number;
  maxSelect?: number;
  optionCardClass: string;
}) {
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  const atMax = maxSelect !== undefined && selected.length >= maxSelect;
  const belowMin = minSelect !== undefined && selected.length < minSelect;

  function toggle(value: string, checked: boolean) {
    setSelected((prev) => (checked ? [...prev, value] : prev.filter((v) => v !== value)));
  }

  return (
    <div className="flex flex-col gap-2.5">
      {options.map((opt) => {
        const checked = selected.includes(opt.value);
        const disabled = !checked && atMax;
        return (
          <label
            key={opt.value}
            className={`${optionCardClass} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <input
              type="checkbox"
              name="value"
              value={opt.value}
              checked={checked}
              disabled={disabled}
              onChange={(e) => toggle(opt.value, e.target.checked)}
              className="mt-1 accent-petrol"
            />
            <span>{opt.label}</span>
          </label>
        );
      })}
      {minSelect || maxSelect ? (
        <p className={`text-[12px] ${belowMin ? "text-role-3" : "text-ink-muted"}`}>
          {selected.length} selecionada{selected.length === 1 ? "" : "s"}
          {minSelect ? ` · mínimo ${minSelect}` : ""}
          {maxSelect ? ` · máximo ${maxSelect}` : ""}
        </p>
      ) : null}
    </div>
  );
}
