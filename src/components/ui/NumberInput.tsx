import { useEffect, useRef, useState, type ComponentProps } from "react";

interface NumberInputProps extends Omit<ComponentProps<"input">, "value" | "onChange" | "type"> {
  value: number | undefined;
  /** Called with a finite number, or `undefined` when the field is cleared. */
  onValueChange: (value: number | undefined) => void;
}

/**
 * Number field that keeps what the user types (including an empty or
 * half-typed value like "-" or "1.") while only ever reporting finite
 * numbers, so NaN can never reach the report data.
 */
export function NumberInput({ value, onValueChange, onFocus, onBlur, ...props }: NumberInputProps) {
  const [draft, setDraft] = useState(value === undefined ? "" : String(value));
  const focused = useRef(false);

  // Follow external changes (e.g. importing a section), but never rewrite
  // what the user is typing.
  useEffect(() => {
    if (focused.current) {
      return;
    }
    setDraft((current) => {
      const parsed = current.trim() === "" ? undefined : Number(current);
      return parsed === value ? current : value === undefined ? "" : String(value);
    });
  }, [value]);

  return (
    <input
      {...props}
      type="number"
      inputMode="decimal"
      value={draft}
      onChange={(event) => {
        const text = event.target.value;
        setDraft(text);
        if (text.trim() === "") {
          onValueChange(undefined);
          return;
        }
        const parsed = Number(text);
        if (Number.isFinite(parsed)) {
          onValueChange(parsed);
        }
      }}
      onFocus={(event) => {
        focused.current = true;
        onFocus?.(event);
      }}
      onBlur={(event) => {
        focused.current = false;
        setDraft(value === undefined ? "" : String(value));
        onBlur?.(event);
      }}
    />
  );
}
