import { forwardRef, useId } from "react";
import { fieldClass } from "./fieldStyles";

// forwardRef lets react-hook-form attach its ref to the real <input>
export const Input = forwardRef(function Input({ label, error, hint, className = "", id, ...props }, ref) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={fieldClass(error)}
        {...props}
      />
      {hint && !error && <p className="muted mt-1 text-xs">{hint}</p>}
      {error && (
        <p id={`${inputId}-error`} role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});
