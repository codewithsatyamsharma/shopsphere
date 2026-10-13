import { Heart } from "lucide-react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toggleWishlist } from "../wishlistSlice";

export function WishlistButton({ productId, className = "" }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const wished = useSelector((state) => state.wishlist.ids.includes(productId));

  const onClick = async (event) => {
    event.preventDefault(); // the card around the heart is a link: do not navigate
    event.stopPropagation();
    if (!user) {
      toast("Log in to save items to your wishlist");
      navigate("/login", { state: { from: location } });
      return;
    }
    // The heart flips instantly (optimistic). If the request fails, the slice flips it back.
    const result = await dispatch(toggleWishlist({ productId, wished }));
    if (toggleWishlist.rejected.match(result)) {
      toast.error(result.payload?.message ?? "Could not update your wishlist");
    }
  };

  return (
    <button
      onClick={onClick}
      aria-pressed={wished}
      aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
      className={`grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm hover:bg-white dark:bg-slate-800/90 ${className}`}
    >
      <Heart className={`h-5 w-5 ${wished ? "fill-red-500 text-red-500" : "text-slate-600 dark:text-slate-300"}`} />
    </button>
  );
}
