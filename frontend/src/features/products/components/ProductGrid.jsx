import { Skeleton } from "../../../components/ui/Skeleton";
import { ProductCard } from "./ProductCard";

export const gridClass = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4";

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 12 }) {
  return (
    <div className={gridClass} role="status" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

export function ProductGrid({ products, dimmed = false }) {
  return (
    <div className={`${gridClass} transition-opacity ${dimmed ? "opacity-50" : ""}`}>
      {products.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
  );
}
