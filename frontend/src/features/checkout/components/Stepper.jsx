import { Check } from "lucide-react";
import { STEPS } from "../checkoutReducer";

export function Stepper({ current }) {
  return (
    <ol className="mb-8 flex items-center" aria-label="Checkout progress">
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none" aria-current={active ? "step" : undefined}>
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                done || active ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-700"
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span className={`ml-2 hidden text-sm sm:inline ${active ? "font-semibold" : "muted"}`}>{label}</span>
            {index < STEPS.length - 1 && (
              <span className={`mx-3 h-0.5 flex-1 ${done ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"}`} aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
