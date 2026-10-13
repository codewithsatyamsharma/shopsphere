import { forwardRef, useId } from "react";
import { fieldClass } from "./fieldStyles";

export const Select = forwardRef(function Select({ label, error, className = "", id, children, ...props }, ref) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="mb-1 block text-sm font-medium">
          {label}
        </label>
      )}
      <select id={selectId} ref={ref} aria-invalid={Boolean(error)} className={fieldClass(error)} {...props}>
        {children}
      </select>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});
