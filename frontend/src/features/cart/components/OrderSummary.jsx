import { useSelector } from "react-redux";
import { formatINR, FREE_SHIPPING_FROM } from "../../../lib/format";
import { selectCartItems, selectShippingFee, selectSubtotal, selectTotal } from "../cartSlice";
import { onImageError } from "../../../lib/images";

// Reads totals from the cart. These are for display only: the server recalculates when you order.
export function OrderSummary({ showItems = false, children }) {
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectSubtotal);
  const shipping = useSelector(selectShippingFee);
  const total = useSelector(selectTotal);
  const row = "flex justify-between text-sm";

  return (
    <aside className="card sticky top-24 p-5" aria-label="Order summary">
      <h2 className="mb-4 text-lg font-semibold">Order summary</h2>
      {showItems && (
        <ul className="mb-4 max-h-64 space-y-3 overflow-y-auto border-b border-slate-200 pb-4 dark:border-slate-700">
          {items.map((item) => (
            <li key={item.productId} className="flex items-center gap-3 text-sm">
              <img onError={onImageError} src={item.image} alt="" className="h-12 w-12 rounded-md object-cover" />
              <span className="line-clamp-2 flex-1">{item.name}</span>
              <span className="muted">×{item.quantity}</span>
              <span className="font-medium">{formatINR(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="space-y-2">
        <p className={row}><span className="muted">Subtotal</span><span>{formatINR(subtotal)}</span></p>
        <p className={row}><span className="muted">Shipping</span><span>{shipping === 0 ? "Free" : formatINR(shipping)}</span></p>
        {shipping > 0 && subtotal > 0 && (
          <p className="rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            Add {formatINR(FREE_SHIPPING_FROM - subtotal)} more for free shipping
          </p>
        )}
        <p className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold dark:border-slate-700">
          <span>Total</span><span>{formatINR(total)}</span>
        </p>
      </div>
      {children && <div className="mt-5">{children}</div>}
    </aside>
  );
}
