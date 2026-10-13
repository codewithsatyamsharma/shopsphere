import { Suspense } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { ArrowLeft, LayoutDashboard, Package, ShoppingBag } from "lucide-react";
import { FullPageSpinner } from "../ui/Spinner";

const link = ({ isActive }) =>
  `flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
  }`;

export function AdminLayout() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="shrink-0 rounded-xl bg-slate-900 p-3 lg:w-56 dark:bg-slate-950">
        <p className="hidden px-3 pb-3 pt-2 text-xs font-semibold uppercase tracking-wider text-slate-400 lg:block">Admin</p>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Admin">
          <NavLink to="/admin" end className={link}><LayoutDashboard className="h-4 w-4" />Dashboard</NavLink>
          <NavLink to="/admin/products" className={link}><Package className="h-4 w-4" />Products</NavLink>
          <NavLink to="/admin/orders" className={link}><ShoppingBag className="h-4 w-4" />Orders</NavLink>
          <Link to="/" className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white lg:mt-4">
            <ArrowLeft className="h-4 w-4" />Back to shop
          </Link>
        </nav>
      </aside>
      <section className="min-w-0 flex-1">
        <Suspense fallback={<FullPageSpinner />}>
          <Outlet />
        </Suspense>
      </section>
    </div>
  );
}
