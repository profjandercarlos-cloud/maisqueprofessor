import type { DiagnosticStep } from "@/lib/diagnostico/steps";

const textareaClass =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-3 text-[15px] text-ink outline-none focus:border-petrol min-h-[120px] resize-y";

const optionCardClass =
  "flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-paper px-4 py-3 text-[15px] text-ink transition-colors has-[:checked]:border-petrol has-[:checked]:bg-gold-soft";

export function StepFields({ step, currentValue }: { step: DiagnosticStep; currentValue: unknown }) {
  switch (step.type) {
    case "intention":
    case "single-select": {
      const selected = typeof currentValue === "string" ? currentValue : undefined;
      return (
        <div className="flex flex-col gap-2.5">
          {step.options.map((opt) => (
            <label key={opt.value} className={optionCardClass}>
              <input
                type="radio"
                name="value"
                value={opt.value}
                defaultChecked={selected === opt.value}
                required
                className="mt-1 accent-petrol"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      );
    }

    case "multi-select": {
      const selected = Array.isArray(currentValue) ? (currentValue as string[]) : [];
      return (
        <div className="flex flex-col gap-2.5">
          {step.options.map((opt) => (
            <label key={opt.value} className={optionCardClass}>
              <input
                type="checkbox"
                name="value"
                value={opt.value}
                defaultChecked={selected.includes(opt.value)}
                className="mt-1 accent-petrol"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      );
    }

    case "textarea": {
      const value = typeof currentValue === "string" ? currentValue : "";
      return (
        <textarea
          name="value"
          defaultValue={value}
          placeholder={step.placeholder}
          required={!step.optional}
          className={textareaClass}
        />
      );
    }

    case "situation": {
      const values = (currentValue ?? {}) as Record<string, string>;
      return (
        <div className="flex flex-col gap-5">
          {step.fields.map((field) => (
            <div key={field.key}>
              <label
                htmlFor={field.key}
                className="mb-1.5 block text-[13.5px] font-medium text-ink"
              >
                {field.label}
              </label>
              <textarea
                id={field.key}
                name={field.key}
                defaultValue={values[field.key] ?? ""}
                required
                className={`${textareaClass} min-h-[80px]`}
              />
            </div>
          ))}
        </div>
      );
    }

    case "matrix": {
      const values = (currentValue ?? {}) as Record<string, string>;
      return (
        <div className="flex flex-col gap-4">
          {step.rows.map((row) => (
            <div key={row.value} className="rounded-lg border border-line bg-paper p-4">
              <p className="mb-3 text-[15px] font-medium text-ink">{row.label}</p>
              <div className="flex flex-wrap gap-2">
                {step.levels.map((level) => (
                  <label
                    key={level.value}
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-paper-raised px-3.5 py-1.5 text-[13px] text-ink-muted has-[:checked]:border-petrol has-[:checked]:bg-gold-soft has-[:checked]:text-ink"
                  >
                    <input
                      type="radio"
                      name={row.value}
                      value={level.value}
                      defaultChecked={values[row.value] === level.value}
                      required
                      className="accent-petrol"
                    />
                    {level.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}
