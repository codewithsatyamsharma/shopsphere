import { useEffect, useState } from "react";

// Returns `value`, but only after it has stopped changing for `delay` ms.
// The cleanup cancels the previous timer, so only the last change counts.
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
