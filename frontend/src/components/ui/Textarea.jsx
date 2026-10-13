import { forwardRef, useId } from "react";
import { fieldClass } from "./fieldStyles";

export const Textarea = forwardRef(function Textarea({ label, error, className = "", id, rows = 4, ...props }, ref) {
  const autoId = useId();
  const areaId = id ?? autoId;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={areaId} className="mb-1 block text-sm font-medium">
          {label}
        </label>
      )}
      <textarea id={areaId} ref={ref} rows={rows} aria-invalid={Boolean(error)} className={fieldClass(error)} {...props} />
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});
