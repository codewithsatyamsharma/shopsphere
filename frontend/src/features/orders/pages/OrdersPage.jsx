import { useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PackageOpen } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Spinner } from "../../../components/ui/Spinner";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { useInfiniteScroll } from "../../../hooks/useInfiniteScroll";
import { formatDate, formatINR } from "../../../lib/format";
import { useOrders } from "../hooks/useOrders";
import { onImageError } from "../../../lib/images";

const TABS = [["", "All"], ["pending", "Pending"], ["paid", "Paid"], ["shipped", "Shipped"], ["delivered", "Delivered"], ["cancelled", "Cancelled"]];

function OrderCard({ order }) {
  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">Order #{order.id}</p>
          <p className="muted text-xs">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {order.items.slice(0, 4).map((item) => (
            <img onError={onImageError} key={item.id} src={item.image} alt={item.name} title={item.name} className="h-12 w-12 rounded-md object-cover" />
          ))}
          {order.items.length > 4 && <span className="muted text-xs">+{order.items.length - 4} more</span>}
        </div>
        <div className="text-right">
          <p className="muted text-xs">{order.itemCount} item{order.itemCount === 1 ? "" : "s"}</p>
          <p className="font-bold">{formatINR(order.total)}</p>
        </div>
      </div>
      <Link to={`/orders/${order.id}`} className="link mt-3 inline-block text-sm font-medium">View details</Link>
    </li>
  );
}

function OrderList({ status }) {
  const { orders, loading, error, hasMore, loadMore, retry } = useOrders(status);

  // Stable function, so the IntersectionObserver is not recreated on every render
  const onReach = useCallback(() => {
    if (!loading) loadMore();
  }, [loading, loadMore]);
  const sentinel = useInfiniteScroll(onReach, hasMore && !error);

  if (error && orders.length === 0) return <ErrorState message={error} onRetry={retry} />;
  if (loading && orders.length === 0) {
    return <div className="space-y-3" role="status" aria-label="Loading orders">{[1, 2, 3].map((n) => <Skeleton key={n} className="h-36" />)}</div>;
  }
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={PackageOpen}
        title={status ? `No ${status} orders` : "No orders yet"}
        message="When you place an order, it will show up here."
        action={<Link to="/products"><Button>Start shopping</Button></Link>}
      />
    );
  }
  return (
    <>
      <ul className="space-y-3">{orders.map((order) => <OrderCard key={order.id} order={order} />)}</ul>
      {hasMore && (
        <div ref={sentinel} className="flex justify-center py-6" aria-hidden={!loading}>
          {loading && <Spinner className="h-6 w-6 text-indigo-600" />}
        </div>
      )}
      {!hasMore && <p className="muted py-6 text-center text-sm">You have reached the end of your orders.</p>}
    </>
  );
}

export default function OrdersPage() {
  useDocumentTitle("My orders");
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">My orders</h1>
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {TABS.map(([value, label]) => (
          <button
            key={value}
            onClick={() => setParams(value ? { status: value } : {})}
            aria-pressed={status === value}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              status === value ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {/* key={status} remounts the list, which resets its pages when the filter changes */}
      <OrderList key={status} status={status} />
    </div>
  );
}
