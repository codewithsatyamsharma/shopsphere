import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe, sessionExpired } from "../features/auth/authSlice";
import { fetchWishlist } from "../features/wishlist/wishlistSlice";
import { router } from "./router";

export default function App() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  // 1) On first load, ask the server who is logged in (the cookie is sent automatically)
  // 2) If any request later returns 401, clear the user
  useEffect(() => {
    dispatch(fetchMe());
    const onExpired = () => dispatch(sessionExpired());
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, [dispatch]);

  // Load the wishlist ids whenever a user logs in
  useEffect(() => {
    if (user) dispatch(fetchWishlist());
  }, [user?.id, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </>
  );
}
