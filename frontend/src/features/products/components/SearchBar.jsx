import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useDebounce } from "../../../hooks/useDebounce";

// The input is controlled by local state, so typing is instant.
// The URL (and therefore the request) only updates after the user pauses typing.
export function SearchBar({ value, onSearch }) {
  const [text, setText] = useState(value);
  const debounced = useDebounce(text, 400);

  useEffect(() => {
    if (debounced !== value) onSearch(debounced);
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setText(value); // stay in sync when "Clear filters" empties the URL
  }, [value]);

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        aria-label="Search products"
        placeholder="Search products..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-800"
      />
    </div>
  );
}
