export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <Icon className="h-7 w-7" />
        </div>
      )}
      <h2 className="text-lg font-semibold">{title}</h2>
      {message && <p className="muted mt-1 max-w-sm text-sm">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
