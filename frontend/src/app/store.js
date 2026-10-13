import { configureStore, createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import cartReducer, { addItem, clearCart, removeItem, setQuantity, setStock } from "../features/cart/cartSlice";
import wishlistReducer from "../features/wishlist/wishlistSlice";

const CART_KEY = "shopsphere-cart";

const loadCart = () => {
  try {
    const items = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
};

// Middleware that saves the cart to localStorage after every cart action
const persistCart = createListenerMiddleware();
persistCart.startListening({
  matcher: isAnyOf(addItem, setQuantity, removeItem, setStock, clearCart),
  effect: (_action, listenerApi) => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(listenerApi.getState().cart.items));
    } catch {}
  },
});

export const makeStore = (preloadedState) =>
  configureStore({
    reducer: { auth: authReducer, cart: cartReducer, wishlist: wishlistReducer },
    preloadedState,
    middleware: (getDefault) => getDefault().prepend(persistCart.middleware),
  });

export const store = makeStore({ cart: { items: loadCart() } });
