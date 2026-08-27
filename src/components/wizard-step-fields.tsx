import type { WizardStep } from "@/lib/wizard/step-types";
import { CharCounterTextarea } from "@/components/char-counter-textarea";
import { CheckboxGroupField } from "@/components/checkbox-group-field";

const textareaClass =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-3 text-[15px] text-ink outline-none focus:border-petrol min-h-[120px] resize-y";

const optionCardClass =
  "flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-paper px-4 py-3 text-[15px] text-ink transition-colors hover:bg-paper-raised hover:shadow-[var(--shadow)] has-[:checked]:border-petrol has-[:checked]:bg-gold-soft has-[:checked]:shadow-none";

const numberInputClass =
  "w-32 rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-petrol";

function hasOtherOption(options: { value: string }[]) {
  return options.some((o) => o.value === "outro");
}

function OtherDetailField({ currentValue }: { currentValue: unknown }) {
  const value = typeof currentValue === "string" ? currentValue : "";
  return (
    <div className="mt-1">
      <label htmlFor="outro_detalhe" className="mb-1.5 block text-[13.5px] font-medium text-ink-muted">
        Se marcou &quot;Outro&quot;, descreva aqui
      </label>
      <textarea
        id="outro_detalhe"
        name="outro_detalhe"
        defaultValue={value}
        className={`${textareaClass} min-h-[70px]`}
      />
    </div>
  );
}

export function StepFields({
  step,
  currentValue,
  otherDetailValue,
}: {
  step: WizardStep;
  currentValue: unknown;
  otherDetailValue?: unknown;
}) {
  switch (step.type) {
    case "intention":
    case "single-select": {
      const selected = typeof currentValue === "string" ? currentValue : undefined;
      const showOther = step.type === "single-select" && step.allowOther && hasOtherOption(step.options);
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
          {showOther ? <OtherDetailField currentValue={otherDetailValue} /> : null}
        </div>
      );
    }

    case "multi-select": {
      const selected = Array.isArray(currentValue) ? (currentValue as string[]) : [];
      const showOther = step.allowOther && hasOtherOption(step.options);
      return (
        <div className="flex flex-col gap-2.5">
          <CheckboxGroupField
            options={step.options}
            defaultSelected={selected}
            minSelect={step.minSelect}
            maxSelect={step.maxSelect}
            optionCardClass={optionCardClass}
          />
          {showOther ? <OtherDetailField currentValue={otherDetailValue} /> : null}
        </div>
      );
    }

    case "textarea": {
      const value = typeof currentValue === "string" ? currentValue : "";
      const isSkipSentinel = value === "__SEM_RESPOSTA__";
      return (
        <div className="flex flex-col gap-3">
          <CharCounterTextarea
            name="value"
            defaultValue={isSkipSentinel ? "" : value}
            placeholder={step.placeholder}
            required={!step.optional && !step.allowSkipWithCheckbox}
            disabled={isSkipSentinel}
            minChars={step.minChars}
            maxChars={step.maxChars}
            className={textareaClass}
          />
          {step.allowSkipWithCheckbox ? (
            <label className="flex cursor-pointer items-center gap-2 text-[13.5px] text-ink-muted">
              <input
                type="checkbox"
                name="skip"
                defaultChecked={isSkipSentinel}
                className="accent-petrol"
              />
              {step.allowSkipWithCheckbox}
            </label>
          ) : null}
        </div>
      );
    }

    case "number": {
      const value = typeof currentValue === "number" ? currentValue : step.defaultValue;
      return (
        <input
          name="value"
          type="number"
          min={step.min}
          max={step.max}
          step={step.step}
          required
          defaultValue={value}
          className={numberInputClass}
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
              <CharCounterTextarea
                id={field.key}
                name={field.key}
                defaultValue={values[field.key] ?? ""}
                required
                minChars={field.minChars}
                maxChars={field.maxChars}
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
