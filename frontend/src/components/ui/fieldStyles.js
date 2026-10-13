export const fieldClass = (error) =>
  `w-full rounded-lg border bg-white px-3 py-2 text-sm placeholder:text-slate-400 dark:bg-slate-900 ` +
  `focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60 ` +
  (error ? "border-red-500" : "border-slate-300 dark:border-slate-600");
