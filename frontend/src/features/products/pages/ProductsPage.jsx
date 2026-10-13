import { useState } from "react";
import { PackageSearch, SlidersHorizontal } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { Pagination } from "../../../components/ui/Pagination";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { FilterSidebar } from "../components/FilterSidebar";
import { ProductGrid, ProductGridSkeleton } from "../components/ProductGrid";
import { SearchBar } from "../components/SearchBar";
import { hasActiveFilters, useProductFilters } from "../hooks/useProductFilters";
import { useProducts } from "../hooks/useProducts";

const SORTS = [
  ["newest", "Newest"],
  ["popular", "Most popular"],
  ["rating", "Top rated"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
];

export default function ProductsPage() {
  useDocumentTitle("Products");
  const { filters, update, reset } = useProductFilters();
  const { data, loading, error, refetch } = useProducts(filters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const total = data?.pagination.total;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">
          Products {total !== undefined && <span className="muted text-base font-normal">({total})</span>}
        </h1>
        <div className="flex flex-1 items-center gap-2 sm:max-w-xl">
          <SearchBar value={filters.search} onSearch={(search) => update({ search })} />
          <select
            aria-label="Sort products"
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value === "newest" ? "" : e.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          >
            {SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <Button variant="secondary" className="lg:hidden" onClick={() => setFiltersOpen(true)} aria-label="Open filters">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-8">
        <aside className="hidden w-56 shrink-0 lg:block" aria-label="Filters">
          <FilterSidebar filters={filters} update={update} reset={reset} />
        </aside>

        <div className="min-w-0 flex-1">
          {error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : loading && !data ? (
            <ProductGridSkeleton />
          ) : data.products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No products found"
              message="Try a different search or remove some filters."
              action={hasActiveFilters(filters) && <Button onClick={reset}>Clear filters</Button>}
            />
          ) : (
            <>
              <ProductGrid products={data.products} dimmed={loading} />
              <Pagination
                page={data.pagination.page}
                totalPages={data.pagination.totalPages}
                onChange={(page) => {
                  update({ page });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </>
          )}
        </div>
      </div>

      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters" size="sm">
        <FilterSidebar filters={filters} update={update} reset={reset} />
        <Button className="mt-4 w-full" onClick={() => setFiltersOpen(false)}>Show results</Button>
      </Modal>
    </div>
  );
}
