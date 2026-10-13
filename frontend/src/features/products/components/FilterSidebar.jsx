import { useEffect, useState } from "react";
import { useApi } from "../../../hooks/useApi";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Skeleton } from "../../../components/ui/Skeleton";
import { hasActiveFilters } from "../hooks/useProductFilters";

const RATINGS = [["", "Any rating"], ["4", "4 stars & up"], ["3", "3 stars & up"]];

export function FilterSidebar({ filters, update, reset }) {
  const { data: categories, loading } = useApi("/categories");
  const [min, setMin] = useState(filters.minPrice);
  const [max, setMax] = useState(filters.maxPrice);

  useEffect(() => {
    setMin(filters.minPrice);
    setMax(filters.maxPrice);
  }, [filters.minPrice, filters.maxPrice]);

  const applyPrice = (e) => {
    e.preventDefault();
    update({ minPrice: min, maxPrice: max });
  };

  const group = "border-b border-slate-200 pb-4 dark:border-slate-700";
  const heading = "mb-2 text-sm font-semibold";
  const option = "flex cursor-pointer items-center gap-2 py-1 text-sm";

  return (
    <div className="space-y-4">
      <fieldset className={group}>
        <legend className={heading}>Category</legend>
        <label className={option}>
          <input type="radio" name="category" checked={filters.category === ""} onChange={() => update({ category: "" })} />
          All categories
        </label>
        {loading && !categories
          ? [1, 2, 3].map((n) => <Skeleton key={n} className="my-2 h-4 w-3/4" />)
          : categories?.map((c) => (
              <label key={c.id} className={option}>
                <input type="radio" name="category" checked={filters.category === c.slug} onChange={() => update({ category: c.slug })} />
                {c.name} <span className="muted text-xs">({c.productCount})</span>
              </label>
            ))}
      </fieldset>

      <form onSubmit={applyPrice} className={group}>
        <p className={heading}>Price (₹)</p>
        <div className="flex items-center gap-2">
          <Input aria-label="Minimum price" type="number" min="0" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value)} />
          <span className="muted">to</span>
          <Input aria-label="Maximum price" type="number" min="0" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value)} />
        </div>
        <Button type="submit" variant="secondary" size="sm" className="mt-2 w-full">Apply</Button>
      </form>

      <fieldset className={group}>
        <legend className={heading}>Rating</legend>
        {RATINGS.map(([value, label]) => (
          <label key={value} className={option}>
            <input type="radio" name="rating" checked={filters.minRating === value} onChange={() => update({ minRating: value })} />
            {label}
          </label>
        ))}
      </fieldset>

      <label className={option}>
        <input type="checkbox" checked={filters.inStock === "true"} onChange={(e) => update({ inStock: e.target.checked ? "true" : "" })} />
        In stock only
      </label>

      {hasActiveFilters(filters) && (
        <Button variant="ghost" size="sm" className="w-full" onClick={reset}>Clear all filters</Button>
      )}
    </div>
  );
}
