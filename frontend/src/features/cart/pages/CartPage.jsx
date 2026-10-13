import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { formatINR, MAX_PER_ITEM } from "../../../lib/format";
import { OrderSummary } from "../components/OrderSummary";
import { removeItem, selectCartItems, setQuantity } from "../cartSlice";
import { onImageError } from "../../../lib/images";

export default function CartPage() {
  useDocumentTitle("Your cart");
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        message="Looks like you have not added anything yet."
        action={<Link to="/products"><Button>Browse products</Button></Link>}
      />
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Shopping cart</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <ul className="space-y-3 lg:col-span-2">
          {items.map((item) => {
            const max = Math.min(item.stock, MAX_PER_ITEM);
            return (
              <li key={item.productId} className="card flex gap-4 p-4">
                <Link to={`/products/${item.productId}`} className="shrink-0">
                  <img onError={onImageError} src={item.image} alt="" className="h-24 w-24 rounded-lg object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/products/${item.productId}`} className="font-medium hover:text-indigo-600">{item.name}</Link>
                    <button onClick={() => dispatch(removeItem(item.productId))} aria-label={`Remove ${item.name}`} className="rounded p-1 text-slate-400 hover:text-red-600">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-600" role="group" aria-label={`Quantity of ${item.name}`}>
                      <button onClick={() => dispatch(setQuantity({ productId: item.productId, quantity: item.quantity - 1 }))} aria-label="Decrease quantity" className="p-2">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium" aria-live="polite">{item.quantity}</span>
                      <button onClick={() => dispatch(setQuantity({ productId: item.productId, quantity: item.quantity + 1 }))} disabled={item.quantity >= max} aria-label="Increase quantity" className="p-2 disabled:opacity-40">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-right">
                      <span className="font-bold">{formatINR(item.price * item.quantity)}</span>
                      {item.quantity > 1 && <span className="muted block text-xs">{formatINR(item.price)} each</span>}
                    </p>
                  </div>
                  {item.quantity >= max && <p className="text-xs text-amber-600">Maximum available quantity reached</p>}
                </div>
              </li>
            );
          })}
        </ul>
        <OrderSummary>
          {/* /checkout is a protected route: guests are sent to log in and then brought back here */}
          <Link to="/checkout"><Button size="lg" className="w-full">Proceed to checkout</Button></Link>
          <Link to="/products" className="link mt-3 block text-center text-sm">Continue shopping</Link>
        </OrderSummary>
      </div>
    </div>
  );
}
