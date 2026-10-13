import { Star } from "lucide-react";

// Read-only stars when `onChange` is missing; an accessible radio group when it is given.
export function StarRating({ value = 0, onChange, size = "h-4 w-4", name = "rating" }) {
  if (!onChange) {
    return (
      <span className="inline-flex" role="img" aria-label={`${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`${size} ${n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`}
          />
        ))}
      </span>
    );
  }
  return (
    <fieldset className="flex" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className="cursor-pointer p-0.5">
          <input
            type="radio"
            name={name}
            value={n}
            checked={value === n}
            onChange={() => onChange(n)}
            className="peer sr-only"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          />
          <Star
            className={`h-7 w-7 peer-focus-visible:outline-2 peer-focus-visible:outline-indigo-500 ${
              n <= value ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"
            }`}
          />
        </label>
      ))}
    </fieldset>
  );
}
