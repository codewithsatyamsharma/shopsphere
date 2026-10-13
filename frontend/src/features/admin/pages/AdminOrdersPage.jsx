import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Search, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Pagination } from "../../../components/ui/Pagination";
import { Skeleton } from "../../../components/ui/Skeleton";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { useApi } from "../../../hooks/useApi";
import { useDebounce } from "../../../hooks/useDebounce";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { api, getErrorMessage } from "../../../lib/api";
import { formatDate, formatINR } from "../../../lib/format";
import { onImageError } from "../../../lib/images";

// Mirrors the server's rules, so the dropdown only offers legal next steps
const NEXT_STATUSES = {
  pending: ["paid", "shipped", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};
const FILTERS = ["", "pending", "paid", "shipped", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  useDocumentTitle("Manage orders");
  const [status, setStatus] = useState("");
  const [searchText, setSearchText] = useState("");
  const search = useDebounce(searchText, 400);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);

  useEffect(() => setPage(1), [status, search]);

  const { data, loading, error, refetch } = useApi("/admin/orders", { status, search, page, limit: 8 });

  const changeStatus = async (order, next) => {
    if (!next) return;
    setUpdating(order.id);
    try {
      await api.patch(`/admin/orders/${order.id}/status`, { status: next });
      toast.success(`Order #${order.id} marked as ${next}`);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Orders</h1>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            aria-label="Search orders"
            placeholder="Order number, customer name or email"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
        </div>
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm capitalize dark:border-slate-600 dark:bg-slate-800"
        >
          {FILTERS.map((s) => <option key={s} value={s}>{s || "All statuses"}</option>)}
        </select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : loading && !data ? (
        <div className="space-y-2" role="status" aria-label="Loading orders">{[1, 2, 3, 4, 5].map((n) => <Skeleton key={n} className="h-14" />)}</div>
      ) : data.orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No orders found" message="Try a different filter or search." />
      ) : (
        <>
          <div className={`card overflow-x-auto ${loading ? "opacity-60" : ""}`}>
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide dark:border-slate-700">
                <tr className="muted">
                  <th scope="col" className="w-10 p-3"><span className="sr-only">Details</span></th>
                  <th scope="col" className="p-3">Order</th>
                  <th scope="col" className="p-3">Customer</th>
                  <th scope="col" className="p-3">Date</th>
                  <th scope="col" className="p-3">Total</th>
                  <th scope="col" className="p-3">Status</th>
                  <th scope="col" className="p-3">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {data.orders.map((order) => {
                  const open = expanded === order.id;
                  const next = NEXT_STATUSES[order.status];
                  return (
                    <Fragment key={order.id}>
                      <tr>
                        <td className="p-3">
                          <button onClick={() => setExpanded(open ? null : order.id)} aria-expanded={open} aria-label={`${open ? "Hide" : "Show"} items of order ${order.id}`}>
                            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className="p-3 font-medium">#{order.id}</td>
                        <td className="p-3">
                          <p>{order.customer.name}</p>
                          <p className="muted text-xs">{order.customer.email}</p>
                        </td>
                        <td className="p-3">{formatDate(order.createdAt)}</td>
                        <td className="p-3 font-medium">{formatINR(order.total)}</td>
                        <td className="p-3"><StatusBadge status={order.status} /></td>
                        <td className="p-3">
                          {next.length === 0 ? (
                            <span className="muted text-xs">Final</span>
                          ) : (
                            <select
                              aria-label={`Change status of order ${order.id}`}
                              value=""
                              disabled={updating === order.id}
                              onChange={(e) => changeStatus(order, e.target.value)}
                              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm capitalize dark:border-slate-600 dark:bg-slate-800"
                            >
                              <option value="">Move to...</option>
                              {next.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          )}
                        </td>
                      </tr>
                      {open && (
                        <tr className="bg-slate-50 dark:bg-slate-900/50">
                          <td />
                          <td colSpan={6} className="p-3">
                            <ul className="space-y-2">
                              {order.items.map((item) => (
                                <li key={item.id} className="flex items-center gap-3 text-sm">
                                  <img onError={onImageError} src={item.image} alt="" className="h-9 w-9 rounded object-cover" />
                                  <span className="flex-1">{item.name}</span>
                                  <span className="muted">{formatINR(item.price)} × {item.quantity}</span>
                                  <span className="w-24 text-right font-medium">{formatINR(item.lineTotal)}</span>
                                </li>
                              ))}
                            </ul>
                            <p className="muted mt-2 text-xs">
                              Ship to {order.shippingAddress.name}, {order.shippingAddress.address}, {order.shippingAddress.city} {order.shippingAddress.pincode} · {order.shippingAddress.phone}
                            </p>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
