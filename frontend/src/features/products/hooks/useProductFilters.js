import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

// The URL is the single source of truth for filters. That gives you shareable links,
// a working Back button and filters that survive a refresh, with no extra state to sync.
export function useProductFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo(
    () => ({
      search: params.get("search") ?? "",
      category: params.get("category") ?? "",
      minPrice: params.get("minPrice") ?? "",
      maxPrice: params.get("maxPrice") ?? "",
      minRating: params.get("minRating") ?? "",
      inStock: params.get("inStock") ?? "",
      sort: params.get("sort") ?? "newest",
      page: Number(params.get("page")) || 1,
    }),
    [params],
  );

  const update = useCallback(
    (changes) => {
      setParams((previous) => {
        const next = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(changes)) {
          if (value === "" || value == null) next.delete(key);
          else next.set(key, String(value));
        }
        if (!("page" in changes)) next.delete("page"); // any new filter goes back to page 1
        return next;
      });
    },
    [setParams],
  );

  const reset = useCallback(() => setParams({}), [setParams]);
  return { filters, update, reset };
}

export const hasActiveFilters = (filters) =>
  Object.entries(filters).some(([key, value]) => !["sort", "page"].includes(key) && value !== "");
