import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

export function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto w-full max-w-md py-6">
      <div className="card p-6 shadow-sm sm:p-8">
        <Link to="/" className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-indigo-600 text-white" aria-label="ShopSphere home">
          <ShoppingCart className="h-6 w-6" />
        </Link>
        <h1 className="text-center text-2xl font-bold">{title}</h1>
        <p className="muted mb-6 mt-1 text-center text-sm">{subtitle}</p>
        {children}
      </div>
      <p className="muted mt-4 text-center text-sm">{footer}</p>
    </div>
  );
}
