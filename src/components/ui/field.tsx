"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

const CONTROL =
  "w-full rounded-xl border border-line bg-raised px-3.5 py-2.5 text-body placeholder:text-faint transition focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60";

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  suffix?: string;
  className?: string;
  children: (id: string) => React.ReactNode;
}

export function Field({ label, hint, error, suffix, className, children }: FieldShellProps) {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-muted">
        {label}
      </label>
      <div className="relative">
        {children(id)}
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-faint">
            {suffix}
          </span>
        )}
      </div>
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  );
}

interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "className"> {
  label: string;
  hint?: string;
  error?: string;
  suffix?: string;
  inputClassName?: string;
  className?: string;
}

export function TextField({
  label,
  hint,
  error,
  suffix,
  inputClassName,
  className,
  ...props
}: TextFieldProps) {
  return (
    <Field label={label} hint={hint} error={error} suffix={suffix} className={className}>
      {(id) => (
        <input
          {...props}
          id={id}
          className={cn(
            CONTROL,
            suffix && "pr-12",
            props.type === "number" && "tabular",
            inputClassName,
          )}
        />
      )}
    </Field>
  );
}

interface SelectFieldProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id" | "className"> {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  options: Array<{ value: string; label: string }>;
}

export function SelectField({
  label,
  hint,
  error,
  className,
  options,
  ...props
}: SelectFieldProps) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(id) => (
        <select {...props} id={id} className={cn(CONTROL, "appearance-none pr-9")}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

interface TextAreaFieldProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className"> {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
}

export function TextAreaField({
  label,
  hint,
  error,
  className,
  ...props
}: TextAreaFieldProps) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(id) => <textarea {...props} id={id} className={cn(CONTROL, "resize-y")} />}
    </Field>
  );
}

interface SegmentedProps<T extends string> {
  label?: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; detail?: string }>;
  columns?: number;
  className?: string;
}

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  columns,
  className,
}: SegmentedProps<T>) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <p className="text-sm font-medium text-muted">{label}</p>}
      <div
        role="radiogroup"
        aria-label={label}
        className={cn(
          "grid gap-1.5 rounded-2xl border border-line bg-surface p-1.5",
          columns ? "" : "grid-flow-col auto-cols-fr",
        )}
        style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-accent text-accent-ink"
                  : "text-muted hover:bg-raised hover:text-body",
              )}
            >
              <span className="block">{option.label}</span>
              {option.detail && (
                <span
                  className={cn(
                    "mt-0.5 block text-[0.6875rem] leading-tight font-normal",
                    active ? "text-accent-ink/70" : "text-faint",
                  )}
                >
                  {option.detail}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ToggleProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, hint, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left transition hover:border-muted/40"
    >
      <span className="flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-faint">{hint}</span>}
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-accent" : "bg-line",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-ink transition-all",
            checked ? "left-[1.375rem]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}
