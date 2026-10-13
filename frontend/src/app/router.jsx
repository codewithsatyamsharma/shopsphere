import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "../components/layout/RootLayout";
import { AdminLayout } from "../components/layout/AdminLayout";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import RouteError from "../pages/RouteError";

// React.lazy splits each page into its own file that downloads only when first visited
const HomePage = lazy(() => import("../features/products/pages/HomePage"));
const ProductsPage = lazy(() => import("../features/products/pages/ProductsPage"));
const ProductDetailsPage = lazy(() => import("../features/products/pages/ProductDetailsPage"));
const CartPage = lazy(() => import("../features/cart/pages/CartPage"));
const LoginPage = lazy(() => import("../features/auth/pages/LoginPage"));
const RegisterPage = lazy(() => import("../features/auth/pages/RegisterPage"));
const CheckoutPage = lazy(() => import("../features/checkout/pages/CheckoutPage"));
const OrdersPage = lazy(() => import("../features/orders/pages/OrdersPage"));
const OrderDetailsPage = lazy(() => import("../features/orders/pages/OrderDetailsPage"));
const WishlistPage = lazy(() => import("../features/wishlist/pages/WishlistPage"));
const ProfilePage = lazy(() => import("../features/profile/pages/ProfilePage"));
const DashboardPage = lazy(() => import("../features/admin/pages/DashboardPage"));
const AdminProductsPage = lazy(() => import("../features/admin/pages/AdminProductsPage"));
const AdminOrdersPage = lazy(() => import("../features/admin/pages/AdminOrdersPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "products", element: <ProductsPage /> },
      { path: "products/:id", element: <ProductDetailsPage /> },
      { path: "cart", element: <CartPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      {
        // a layout route with no path: guards every child route
        element: <ProtectedRoute />,
        children: [
          { path: "checkout", element: <CheckoutPage /> },
          { path: "orders", element: <OrdersPage /> },
          { path: "orders/:id", element: <OrderDetailsPage /> },
          { path: "wishlist", element: <WishlistPage /> },
          { path: "profile", element: <ProfilePage /> },
        ],
      },
      {
        element: <ProtectedRoute role="admin" />,
        children: [
          {
            path: "admin",
            element: <AdminLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: "products", element: <AdminProductsPage /> },
              { path: "orders", element: <AdminOrdersPage /> },
            ],
          },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
