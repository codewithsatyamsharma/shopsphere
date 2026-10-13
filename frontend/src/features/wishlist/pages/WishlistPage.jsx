import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Heart } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { useApi } from "../../../hooks/useApi";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { ProductGrid, ProductGridSkeleton } from "../../products/components/ProductGrid";

export default function WishlistPage() {
  useDocumentTitle("Wishlist");
  const { data, loading, error, refetch } = useApi("/wishlist");
  const ids = useSelector((state) => state.wishlist.ids);

  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (loading && !data) return <ProductGridSkeleton count={4} />;

  // Filtering by the live list of ids makes a card disappear the instant its heart is clicked
  const products = data.filter((product) => ids.includes(product.id));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My wishlist <span className="muted text-base font-normal">({products.length})</span></h1>
      {products.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          message="Tap the heart on any product to save it for later."
          action={<Link to="/products"><Button>Browse products</Button></Link>}
        />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
