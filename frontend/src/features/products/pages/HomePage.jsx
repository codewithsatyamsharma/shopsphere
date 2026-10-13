import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CookingPot, CreditCard, Dumbbell, Headphones, Package, RotateCcw, ShieldCheck, Shirt, Truck } from "lucide-react";
import { useApi } from "../../../hooks/useApi";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Skeleton } from "../../../components/ui/Skeleton";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { ProductGrid, ProductGridSkeleton } from "../components/ProductGrid";

const CATEGORY_ICONS = {
  electronics: Headphones,
  fashion: Shirt,
  "home-kitchen": CookingPot,
  books: BookOpen,
  "sports-fitness": Dumbbell,
};

const PERKS = [
  [Truck, "Free shipping", "On orders of ₹999 or more"],
  [RotateCcw, "Easy cancellation", "Cancel before it ships"],
  [ShieldCheck, "Secure checkout", "Your data stays safe"],
  [CreditCard, "Flexible payment", "COD, card or UPI"],
];

export default function HomePage() {
  useDocumentTitle();
  const featured = useApi("/products/featured");
  const categories = useApi("/categories");

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-6 py-14 text-white sm:px-12 sm:py-20">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" aria-hidden="true" />
        <div className="absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-white/10" aria-hidden="true" />
        <div className="relative max-w-xl">
          <p className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium">New season, new deals</p>
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">Everything you need, delivered to your door.</h1>
          <p className="mt-4 text-indigo-100">Discover electronics, fashion, books and more, with up to 40% off on selected items.</p>
          <Link to="/products" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-indigo-700 hover:bg-indigo-50">
            Shop now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section aria-labelledby="cat-heading">
        <h2 id="cat-heading" className="mb-4 text-xl font-bold">Shop by category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.loading && !categories.data
            ? [1, 2, 3, 4, 5].map((n) => <Skeleton key={n} className="h-24" />)
            : categories.data?.map((c) => {
                const Icon = CATEGORY_ICONS[c.slug] ?? Package;
                return (
                  <Link key={c.id} to={`/products?category=${c.slug}`} className="card flex flex-col items-center gap-2 p-5 text-center transition-shadow hover:shadow-md">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="muted text-xs">{c.productCount} items</span>
                  </Link>
                );
              })}
        </div>
      </section>

      <section aria-labelledby="featured-heading">
        <div className="mb-4 flex items-end justify-between">
          <h2 id="featured-heading" className="text-xl font-bold">Featured products</h2>
          <Link to="/products" className="link text-sm font-medium">View all</Link>
        </div>
        {featured.error ? (
          <ErrorState message={featured.error} onRetry={featured.refetch} />
        ) : featured.loading && !featured.data ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <ProductGrid products={featured.data} />
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Why shop with us">
        {PERKS.map(([Icon, title, text]) => (
          <div key={title} className="card flex items-center gap-4 p-4">
            <Icon className="h-8 w-8 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="muted text-xs">{text}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
