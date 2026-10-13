import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useApi } from "../../../hooks/useApi";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { MAX_PER_ITEM } from "../../../lib/format";
import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Price } from "../../../components/ui/Price";
import { Skeleton } from "../../../components/ui/Skeleton";
import { StarRating } from "../../../components/ui/StarRating";
import { addItem } from "../../cart/cartSlice";
import { WishlistButton } from "../../wishlist/components/WishlistButton";
import { ProductGallery } from "../components/ProductGallery";
import { ProductGrid } from "../components/ProductGrid";
import { ReviewSection } from "../components/ReviewSection";

function DetailsSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-2" role="status" aria-label="Loading product">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { data: product, error, status, refetch } = useApi(`/products/${id}`);
  const related = useApi(`/products/${id}/related`);
  const inCart = useSelector((state) => state.cart.items.find((item) => item.productId === Number(id))?.quantity ?? 0);
  const [quantity, setQuantity] = useState(1);
  useDocumentTitle(product?.name);

  useEffect(() => setQuantity(1), [id]);

  if (error) {
    return (
      <ErrorState
        message={status === 404 ? "This product does not exist or is no longer available." : error}
        onRetry={status === 404 ? undefined : refetch}
      />
    );
  }
  // useApi keeps the previous product while the next one loads, so check that the ids match
  if (!product || String(product.id) !== id) return <DetailsSkeleton />;

  const max = Math.min(product.stock, MAX_PER_ITEM);

  const onAdd = () => {
    if (inCart >= max) {
      toast("You already have the maximum quantity in your cart.");
      return;
    }
    dispatch(addItem({ product, quantity }));
    toast.success(`${product.name} added to cart`);
  };

  const stockMessage =
    product.stock === 0
      ? ["Out of stock", "text-red-600 dark:text-red-400"]
      : product.stock <= 5
        ? [`Only ${product.stock} left in stock`, "text-amber-600 dark:text-amber-400"]
        : ["In stock", "text-emerald-600 dark:text-emerald-400"];

  return (
    <div>
      <nav aria-label="Breadcrumb" className="muted mb-4 text-sm">
        <Link to="/products" className="hover:underline">Products</Link> / {" "}
        <Link to={`/products?category=${product.category.slug}`} className="hover:underline">{product.category.name}</Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={[product.image, ...product.images]} name={product.name} />

        <div>
          <p className="muted text-sm">{product.brand}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <StarRating value={product.rating} size="h-5 w-5" />
            <span className="font-medium">{product.rating ? product.rating.toFixed(1) : "No ratings"}</span>
            <span className="muted">({product.reviewCount} review{product.reviewCount === 1 ? "" : "s"})</span>
          </div>

          <div className="my-5">
            <Price price={product.price} originalPrice={product.originalPrice} discountPercent={product.discountPercent} size="lg" />
          </div>
          <p className={`mb-4 text-sm font-medium ${stockMessage[1]}`}>{stockMessage[0]}</p>
          <p className="muted mb-6 leading-relaxed">{product.description}</p>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-600" role="group" aria-label="Quantity">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1 || max === 0} aria-label="Decrease quantity" className="p-3 disabled:opacity-40">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-medium" aria-live="polite">{max === 0 ? 0 : quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(max, q + 1))} disabled={quantity >= max} aria-label="Increase quantity" className="p-3 disabled:opacity-40">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button size="lg" onClick={onAdd} disabled={!product.inStock} className="flex-1 sm:flex-none">
              <ShoppingCart className="h-5 w-5" />
              {product.inStock ? "Add to cart" : "Out of stock"}
            </Button>
            <WishlistButton productId={product.id} className="border border-slate-300 dark:border-slate-600" />
          </div>
          {inCart > 0 && <p className="muted mt-3 text-sm">{inCart} already in your cart. <Link to="/cart" className="link">View cart</Link></p>}
        </div>
      </div>

      {/* key={product.id} remounts the section for each product, which resets its page and list state */}
      <ReviewSection key={product.id} productId={product.id} onChanged={refetch} />

      {related.data?.length > 0 && (
        <section className="mt-12" aria-labelledby="related-heading">
          <h2 id="related-heading" className="mb-4 text-xl font-bold">You may also like</h2>
          <ProductGrid products={related.data} />
        </section>
      )}
    </div>
  );
}
