import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Skeleton } from "../../../components/ui/Skeleton";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { useApi } from "../../../hooks/useApi";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { api, getErrorMessage } from "../../../lib/api";
import { formatDateTime, formatINR } from "../../../lib/format";
import { OrderTimeline } from "../components/OrderTimeline";
import { onImageError } from "../../../lib/images";

const PAYMENT_LABELS = { cod: "Cash on delivery", card: "Credit / debit card", upi: "UPI" };

export default function OrderDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const { data: order, error, status, refetch } = useApi(`/orders/${id}`);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  useDocumentTitle(`Order #${id}`);

  if (error) {
    return (
      <ErrorState
        message={status === 404 ? "We could not find that order." : error}
        onRetry={status === 404 ? undefined : refetch}
      />
    );
  }
  if (!order || String(order.id) !== id) {
    return <div className="space-y-4" role="status" aria-label="Loading order"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-28" /><Skeleton className="h-64" /></div>;
  }

  const canCancel = ["pending", "paid"].includes(order.status);

  const cancel = async () => {
    setCancelling(true);
    try {
      await api.patch(`/orders/${order.id}/cancel`);
      toast.success("Order cancelled");
      setConfirming(false);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const { shippingAddress: a } = order;
  return (
    <div className="mx-auto max-w-4xl">
      {location.state?.justPlaced && (
        <div role="status" className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <div>
            <p className="font-semibold">Thank you! Your order is confirmed.</p>
            <p className="text-sm">We will keep this page updated as your order moves along.</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/orders" className="link text-sm">← All orders</Link>
          <h1 className="mt-1 text-2xl font-bold">Order #{order.id}</h1>
          <p className="muted text-sm">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="card mb-6 p-5">
        <OrderTimeline status={order.status} createdAt={order.createdAt} updatedAt={order.updatedAt} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="card md:col-span-2">
          <h2 className="border-b border-slate-200 p-4 font-semibold dark:border-slate-700">Items ({order.itemCount})</h2>
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 p-4">
                <img onError={onImageError} src={item.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <Link to={`/products/${item.productId}`} className="font-medium hover:text-indigo-600">{item.name}</Link>
                  <p className="muted text-sm">{formatINR(item.price)} × {item.quantity}</p>
                </div>
                <p className="font-semibold">{formatINR(item.lineTotal)}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="card p-4 text-sm">
            <h2 className="mb-2 font-semibold">Shipping address</h2>
            <p>{a.name}</p>
            <p className="muted">{a.address}</p>
            <p className="muted">{a.city} {a.pincode}</p>
            <p className="muted">{a.phone}</p>
          </div>
          <div className="card space-y-2 p-4 text-sm">
            <h2 className="mb-1 font-semibold">Payment</h2>
            <p className="muted">{PAYMENT_LABELS[order.paymentMethod]}</p>
            <p className="flex justify-between"><span className="muted">Subtotal</span>{formatINR(order.subtotal)}</p>
            <p className="flex justify-between"><span className="muted">Shipping</span>{order.shippingFee === 0 ? "Free" : formatINR(order.shippingFee)}</p>
            <p className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold dark:border-slate-700"><span>Total</span>{formatINR(order.total)}</p>
          </div>
          {canCancel && <Button variant="dangerOutline" className="w-full" onClick={() => setConfirming(true)}>Cancel order</Button>}
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Cancel this order?"
        message="Your items will go back in stock. This cannot be undone."
        confirmLabel="Yes, cancel order"
        danger
        loading={cancelling}
        onConfirm={cancel}
        onClose={() => setConfirming(false)}
      />
    </div>
  );
}
