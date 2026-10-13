import { useCallback, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Heart, LayoutDashboard, LogOut, Menu, Moon, Package, Search, ShoppingCart, Sun, User, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import { logout } from "../../features/auth/authSlice";
import { selectCartCount } from "../../features/cart/cartSlice";

const navClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 hover:text-indigo-600 dark:text-slate-300"
  }`;

export function Navbar() {
  const { user } = useSelector((state) => state.auth);
  const cartCount = useSelector(selectCartCount);
  const { theme, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [query, setQuery] = useState("");
  const userMenuRef = useRef(null);
  useOnClickOutside(userMenuRef, useCallback(() => setUserOpen(false), []));

  const onSearch = (event) => {
    event.preventDefault();
    const text = query.trim();
    navigate(text ? `/products?search=${encodeURIComponent(text)}` : "/products");
    setMobileOpen(false);
  };

  const onLogout = async () => {
    setUserOpen(false);
    setMobileOpen(false);
    await dispatch(logout());
    toast.success("You have been signed out");
    navigate("/");
  };

  const menuLink = "flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <div className="container-page flex h-16 items-center gap-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-indigo-600 dark:text-indigo-400">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">
            <ShoppingCart className="h-4 w-4" />
          </span>
          ShopSphere
        </Link>

        <nav className="ml-4 hidden items-center md:flex" aria-label="Main">
          <NavLink to="/" end className={navClass}>Home</NavLink>
          <NavLink to="/products" className={navClass}>Products</NavLink>
        </nav>

        <form onSubmit={onSearch} role="search" className="mx-auto hidden max-w-md flex-1 md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              aria-label="Search products"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-full border border-slate-300 bg-slate-50 py-2 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-800"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <Link to="/cart" aria-label={`Cart, ${cartCount} items`} className="relative rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span key={cartCount} className="animate-pop absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-indigo-600 px-1 text-[11px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative hidden md:block" ref={userMenuRef}>
              <button
                onClick={() => setUserOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={userOpen}
                className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </button>
              {userOpen && (
                <div role="menu" className="card absolute right-0 mt-2 w-52 overflow-hidden py-1 shadow-lg">
                  <p className="border-b border-slate-200 px-4 py-2 text-sm dark:border-slate-700">
                    <span className="block truncate font-medium">{user.name}</span>
                    <span className="muted block truncate text-xs">{user.email}</span>
                  </p>
                  <Link role="menuitem" to="/orders" className={menuLink} onClick={() => setUserOpen(false)}><Package className="h-4 w-4" />My orders</Link>
                  <Link role="menuitem" to="/wishlist" className={menuLink} onClick={() => setUserOpen(false)}><Heart className="h-4 w-4" />Wishlist</Link>
                  <Link role="menuitem" to="/profile" className={menuLink} onClick={() => setUserOpen(false)}><User className="h-4 w-4" />Profile</Link>
                  {user.role === "admin" && (
                    <Link role="menuitem" to="/admin" className={menuLink} onClick={() => setUserOpen(false)}><LayoutDashboard className="h-4 w-4" />Admin</Link>
                  )}
                  <button role="menuitem" onClick={onLogout} className={`${menuLink} text-red-600`}><LogOut className="h-4 w-4" />Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800">Log in</Link>
              <Link to="/register" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Sign up</Link>
            </div>
          )}

          <button
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="rounded-lg p-2 hover:bg-slate-100 md:hidden dark:hover:bg-slate-800"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden dark:border-slate-700 dark:bg-slate-900">
          <form onSubmit={onSearch} role="search" className="mb-3">
            <input
              type="search"
              aria-label="Search products"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            />
          </form>
          <div className="flex flex-col" onClick={(e) => e.target.closest("a") && setMobileOpen(false)}>
            <Link to="/" className={menuLink}>Home</Link>
            <Link to="/products" className={menuLink}>Products</Link>
            {user ? (
              <>
                <Link to="/orders" className={menuLink}>My orders</Link>
                <Link to="/wishlist" className={menuLink}>Wishlist</Link>
                <Link to="/profile" className={menuLink}>Profile</Link>
                {user.role === "admin" && <Link to="/admin" className={menuLink}>Admin</Link>}
                <button onClick={onLogout} className={`${menuLink} text-red-600`}>Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" className={menuLink}>Log in</Link>
                <Link to="/register" className={menuLink}>Sign up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
