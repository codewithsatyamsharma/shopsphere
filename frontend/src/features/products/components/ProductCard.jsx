import { memo } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { ShoppingCart } from "lucide-react";
import { Price } from "../../../components/ui/Price";
import { StarRating } from "../../../components/ui/StarRating";
import { addItem } from "../../cart/cartSlice";
import { WishlistButton } from "../../wishlist/components/WishlistButton";
import { onImageError } from "../../../lib/images";

// React.memo skips re-rendering a card whose props did not change.
// It only helps because the only prop is `product` (no inline functions are passed down).
export const ProductCard = memo(function ProductCard({ product }) {
  const dispatch = useDispatch();
  const lowStock = product.stock > 0 && product.stock <= 5;

  const onAdd = () => {
    dispatch(addItem({ product }));
    toast.success("Added to cart");
  };

  return (
    <article className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-700">
        <Link to={`/products/${product.id}`} tabIndex={-1} aria-hidden="true">
          <img onError={onImageError}
            src={product.image}
            alt=""
            loading="lazy"
            width="400"
            height="400"
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${product.inStock ? "" : "opacity-60 grayscale"}`}
          />
        </Link>
        <WishlistButton productId={product.id} className="absolute right-2 top-2" />
        {!product.inStock && (
          <span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white">Out of stock</span>
        )}
        {lowStock && (
          <span className="absolute left-2 top-2 rounded bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">Only {product.stock} left</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="muted text-xs">{product.brand || product.category.name}</p>
        <h3 className="line-clamp-2 min-h-10 text-sm font-medium">
          <Link to={`/products/${product.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
            {product.name}
          </Link>
        </h3>
        <div className="flex items-center gap-1.5 text-xs">
          <StarRating value={product.rating} />
          <span className="muted">({product.reviewCount})</span>
        </div>
        <Price price={product.price} originalPrice={product.originalPrice} discountPercent={product.discountPercent} />
        <button
          onClick={onAdd}
          disabled={!product.inStock}
          className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCart className="h-4 w-4" />
          {product.inStock ? "Add to cart" : "Unavailable"}
        </button>
      </div>
    </article>
  );
});
