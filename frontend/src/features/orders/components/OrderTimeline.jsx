import { Check, XCircle } from "lucide-react";
import { formatDateTime } from "../../../lib/format";

const FLOW = ["pending", "paid", "shipped", "delivered"];
const LABELS = { pending: "Placed", paid: "Paid", shipped: "Shipped", delivered: "Delivered" };

export function OrderTimeline({ status, createdAt, updatedAt }) {
  if (status === "cancelled") {
    return (
      <div role="status" className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-red-700 dark:bg-red-500/10 dark:text-red-300">
        <XCircle className="h-6 w-6" />
        <div>
          <p className="font-semibold">Order cancelled</p>
          <p className="text-xs">{formatDateTime(updatedAt)}</p>
        </div>
      </div>
    );
  }
  // COD orders start as "pending". Treat "paid" as skipped when the order jumped straight to shipped.
  const current = FLOW.indexOf(status);
  return (
    <ol className="flex" aria-label="Order progress">
      {FLOW.map((step, index) => {
        const done = index <= current;
        return (
          <li key={step} className="flex flex-1 flex-col items-center text-center" aria-current={index === current ? "step" : undefined}>
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${index === 0 ? "invisible" : index <= current ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"}`} />
              <span className={`grid h-8 w-8 place-items-center rounded-full text-sm ${done ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-700"}`}>
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span className={`h-0.5 flex-1 ${index === FLOW.length - 1 ? "invisible" : index < current ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"}`} />
            </div>
            <span className={`mt-2 text-xs ${done ? "font-semibold" : "muted"}`}>{LABELS[step]}</span>
            {index === 0 && <span className="muted text-[11px]">{formatDateTime(createdAt)}</span>}
          </li>
        );
      })}
    </ol>
  );
}
