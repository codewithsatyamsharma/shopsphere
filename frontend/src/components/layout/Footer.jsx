import { Link } from "react-router-dom";

export function Footer() {
  const heading = "mb-3 text-sm font-semibold";
  const item = "muted block py-1 text-sm hover:text-indigo-600";
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">ShopSphere</p>
          <p className="muted mt-2 max-w-xs text-sm">A practice e-commerce app built with React, Redux Toolkit and Express.</p>
        </div>
        <div>
          <p className={heading}>Shop</p>
          <Link to="/products" className={item}>All products</Link>
          <Link to="/products?category=electronics" className={item}>Electronics</Link>
          <Link to="/products?category=books" className={item}>Books</Link>
        </div>
        <div>
          <p className={heading}>Account</p>
          <Link to="/orders" className={item}>My orders</Link>
          <Link to="/wishlist" className={item}>Wishlist</Link>
          <Link to="/profile" className={item}>Profile</Link>
        </div>
        <div>
          <p className={heading}>Good to know</p>
          <p className="muted py-1 text-sm">Free shipping on orders of ₹999 or more</p>
          <p className="muted py-1 text-sm">Cancel any order before it ships</p>
        </div>
      </div>
      <p className="muted border-t border-slate-200 py-4 text-center text-xs dark:border-slate-700">
        © {new Date().getFullYear()} ShopSphere. Demo project, no real payments.
      </p>
    </footer>
  );
}
