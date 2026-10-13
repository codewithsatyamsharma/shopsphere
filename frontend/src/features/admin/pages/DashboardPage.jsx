import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { IndianRupee, Package, ShoppingBag, Users } from "lucide-react";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Skeleton } from "../../../components/ui/Skeleton";
import { useApi } from "../../../hooks/useApi";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { formatINR } from "../../../lib/format";
import { onImageError } from "../../../lib/images";

const AXIS = { fontSize: 12, fill: "#94a3b8" };

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="muted text-sm">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  useDocumentTitle("Admin dashboard");
  const { data, loading, error, refetch } = useApi("/admin/stats");

  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (loading && !data) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading dashboard">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-20" />)}</div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const { totals, salesByDay, topProducts, lowStock, ordersByStatus } = data;
  const statusData = Object.entries(ordersByStatus).map(([status, count]) => ({ status, count }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={IndianRupee} label="Revenue" value={formatINR(totals.revenue)} />
        <StatCard icon={ShoppingBag} label="Orders" value={totals.orders} />
        <StatCard icon={Package} label="Products" value={totals.products} />
        <StatCard icon={Users} label="Customers" value={totals.customers} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card p-4 xl:col-span-2" aria-label="Revenue for the last 14 days">
          <h2 className="mb-4 font-semibold">Revenue, last 14 days</h2>
          {/* A chart needs a parent with a real height, or it renders empty */}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesByDay} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={AXIS} />
                <YAxis tickFormatter={(v) => (v >= 1000 ? `₹${v / 1000}k` : `₹${v}`)} tick={AXIS} width={52} />
                <Tooltip formatter={(v) => [formatINR(v), "Revenue"]} labelFormatter={(d) => d} />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-4" aria-label="Orders by status">
          <h2 className="mb-4 font-semibold">Orders by status</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={AXIS} />
                <YAxis type="category" dataKey="status" tick={AXIS} width={72} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="mb-3 font-semibold">Top products</h2>
          {topProducts.length === 0 ? (
            <p className="muted text-sm">No sales yet.</p>
          ) : (
            <ol className="space-y-3">
              {topProducts.map((p, index) => (
                <li key={p.productId} className="flex items-center gap-3">
                  <span className="muted w-4 text-sm">{index + 1}</span>
                  <img onError={onImageError} src={p.image} alt="" className="h-10 w-10 rounded-md object-cover" />
                  <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                  <span className="text-right text-sm">
                    <span className="block font-semibold">{p.unitsSold} sold</span>
                    <span className="muted block text-xs">{formatINR(p.revenue)}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Low stock</h2>
            <Link to="/admin/products" className="link text-sm">Manage products</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="muted text-sm">Everything is well stocked.</p>
          ) : (
            <ul className="space-y-3">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <img onError={onImageError} src={p.image} alt="" className="h-10 w-10 rounded-md object-cover" />
                  <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.stock <= 2 ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"}`}>
                    {p.stock} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
