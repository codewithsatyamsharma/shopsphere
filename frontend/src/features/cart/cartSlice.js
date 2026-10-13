import { createSelector, createSlice } from "@reduxjs/toolkit";
import { FREE_SHIPPING_FROM, MAX_PER_ITEM, SHIPPING_FEE } from "../../lib/format";

const limit = (stock) => Math.min(stock, MAX_PER_ITEM);

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [] }, // [{ productId, name, price, image, stock, quantity }]
  reducers: {
    // Inside reducers you may "mutate". Immer turns it into an immutable update for you.
    addItem(state, { payload: { product, quantity = 1 } }) {
      const existing = state.items.find((i) => i.productId === product.id);
      if (existing) {
        existing.stock = product.stock;
        existing.quantity = Math.min(existing.quantity + quantity, limit(product.stock));
      } else {
        state.items.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          stock: product.stock,
          quantity: Math.min(quantity, limit(product.stock)),
        });
      }
    },
    setQuantity(state, { payload: { productId, quantity } }) {
      const item = state.items.find((i) => i.productId === productId);
      if (!item) return;
      if (quantity < 1) state.items = state.items.filter((i) => i.productId !== productId);
      else item.quantity = Math.min(quantity, limit(item.stock));
    },
    removeItem(state, { payload: productId }) {
      state.items = state.items.filter((i) => i.productId !== productId);
    },
    // Used when the server says "only N left" at checkout
    setStock(state, { payload: { productId, stock } }) {
      const item = state.items.find((i) => i.productId === productId);
      if (!item) return;
      item.stock = stock;
      if (stock < 1) state.items = state.items.filter((i) => i.productId !== productId);
      else item.quantity = Math.min(item.quantity, limit(stock));
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addItem, setQuantity, removeItem, setStock, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

// Selectors. createSelector recomputes only when `items` changes (memoisation).
// These totals are for DISPLAY only. The server recalculates everything when you place an order.
export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = createSelector([selectCartItems], (items) =>
  items.reduce((total, item) => total + item.quantity, 0),
);
export const selectSubtotal = createSelector([selectCartItems], (items) =>
  items.reduce((total, item) => total + item.price * item.quantity, 0),
);
export const selectShippingFee = createSelector([selectSubtotal], (subtotal) =>
  subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE,
);
export const selectTotal = createSelector([selectSubtotal, selectShippingFee], (a, b) => a + b);
