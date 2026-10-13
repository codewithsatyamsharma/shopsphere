import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

export function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div role="alert" className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <p className="max-w-sm text-sm">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
