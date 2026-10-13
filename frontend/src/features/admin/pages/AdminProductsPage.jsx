import { useEffect, useState } from "react";
import { Archive, Pencil, Plus, RotateCcw, Search } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Pagination } from "../../../components/ui/Pagination";
import { Skeleton } from "../../../components/ui/Skeleton";
import { useApi } from "../../../hooks/useApi";
import { useDebounce } from "../../../hooks/useDebounce";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { api, getErrorMessage } from "../../../lib/api";
import { formatINR } from "../../../lib/format";
import { ProductFormModal } from "../components/ProductFormModal";
import { onImageError } from "../../../lib/images";

export default function AdminProductsPage() {
  useDocumentTitle("Manage products");
  const [searchText, setSearchText] = useState("");
  const search = useDebounce(searchText, 400);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, product = edit
  const [archiving, setArchiving] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => setPage(1), [search, includeArchived]);

  const { data, loading, error, refetch } = useApi("/products", {
    search,
    page,
    limit: 8,
    includeInactive: includeArchived ? "true" : "",
  });

  const archive = async () => {
    setBusy(true);
    try {
      await api.delete(`/products/${archiving.id}`);
      toast.success("Product archived");
      setArchiving(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const restore = async (product) => {
    try {
      await api.patch(`/products/${product.id}`, { isActive: true });
      toast.success("Product restored");
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={() => setEditing({})}><Plus className="h-4 w-4" />New product</Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="relative min-w-60 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            aria-label="Search products"
            placeholder="Search by name or brand..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="accent-indigo-600" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} />
          Include archived
        </label>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : loading && !data ? (
        <div className="space-y-2" role="status" aria-label="Loading products">{[1, 2, 3, 4, 5].map((n) => <Skeleton key={n} className="h-16" />)}</div>
      ) : data.products.length === 0 ? (
        <EmptyState title="No products found" message="Try a different search." />
      ) : (
        <>
          <div className={`card overflow-x-auto ${loading ? "opacity-60" : ""}`}>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide dark:border-slate-700">
                <tr className="muted">
                  <th scope="col" className="p-3">Product</th>
                  <th scope="col" className="p-3">Category</th>
                  <th scope="col" className="p-3">Price</th>
                  <th scope="col" className="p-3">Stock</th>
                  <th scope="col" className="p-3">Status</th>
                  <th scope="col" className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {data.products.map((p) => (
                  <tr key={p.id} className={p.isActive ? "" : "opacity-60"}>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img onError={onImageError} src={p.image} alt="" className="h-10 w-10 rounded-md object-cover" />
                        <div className="min-w-0">
                          <p className="max-w-56 truncate font-medium">{p.name}</p>
                          <p className="muted text-xs">{p.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{p.category.name}</td>
                    <td className="p-3">{formatINR(p.price)}</td>
                    <td className={`p-3 font-medium ${p.stock <= 5 ? "text-red-600 dark:text-red-400" : ""}`}>{p.stock}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${p.isActive ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"}`}>
                        {p.isActive ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`} className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-700"><Pencil className="h-4 w-4" /></button>
                        {p.isActive ? (
                          <button onClick={() => setArchiving(p)} aria-label={`Archive ${p.name}`} className="rounded p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><Archive className="h-4 w-4" /></button>
                        ) : (
                          <button onClick={() => restore(p)} aria-label={`Restore ${p.name}`} className="rounded p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"><RotateCcw className="h-4 w-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
        </>
      )}

      <ProductFormModal
        open={editing !== null}
        product={editing?.id ? editing : null}
        onClose={() => setEditing(null)}
        onSaved={refetch}
      />
      <ConfirmDialog
        open={archiving !== null}
        title="Archive this product?"
        message={`"${archiving?.name}" will be hidden from the shop. Past orders keep working, and you can restore it later.`}
        confirmLabel="Archive"
        danger
        loading={busy}
        onConfirm={archive}
        onClose={() => setArchiving(null)}
      />
    </div>
  );
}
