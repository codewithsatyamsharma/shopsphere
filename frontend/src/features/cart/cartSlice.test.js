import reducer, {
  addItem,
  clearCart,
  removeItem,
  selectCartCount,
  selectShippingFee,
  selectSubtotal,
  selectTotal,
  setQuantity,
  setStock,
} from "./cartSlice";

const pillow = { id: 1, name: "Pillow", price: 799, image: "x.jpg", stock: 3 };
const book = { id: 2, name: "Book", price: 499, image: "y.jpg", stock: 50 };
const empty = { items: [] };

describe("cartSlice", () => {
  it("adds an item", () => {
    const state = reducer(empty, addItem({ product: pillow }));
    expect(state.items).toEqual([{ productId: 1, name: "Pillow", price: 799, image: "x.jpg", stock: 3, quantity: 1 }]);
  });

  it("merges the same product instead of adding a second line", () => {
    let state = reducer(empty, addItem({ product: pillow }));
    state = reducer(state, addItem({ product: pillow }));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it("never goes above the stock", () => {
    const state = reducer(empty, addItem({ product: pillow, quantity: 99 }));
    expect(state.items[0].quantity).toBe(3);
  });

  it("never goes above 10 per product", () => {
    const state = reducer(empty, addItem({ product: book, quantity: 99 }));
    expect(state.items[0].quantity).toBe(10);
  });

  it("changes a quantity, and removes the line when it drops below 1", () => {
    let state = reducer(empty, addItem({ product: book }));
    state = reducer(state, setQuantity({ productId: 2, quantity: 4 }));
    expect(state.items[0].quantity).toBe(4);
    state = reducer(state, setQuantity({ productId: 2, quantity: 0 }));
    expect(state.items).toHaveLength(0);
  });

  it("removes and clears", () => {
    let state = reducer(empty, addItem({ product: pillow }));
    state = reducer(state, addItem({ product: book }));
    state = reducer(state, removeItem(1));
    expect(state.items.map((i) => i.productId)).toEqual([2]);
    expect(reducer(state, clearCart()).items).toEqual([]);
  });

  it("lowers the quantity when the server reports less stock, and removes at zero", () => {
    let state = reducer(empty, addItem({ product: book, quantity: 5 }));
    state = reducer(state, setStock({ productId: 2, stock: 2 }));
    expect(state.items[0]).toMatchObject({ stock: 2, quantity: 2 });
    state = reducer(state, setStock({ productId: 2, stock: 0 }));
    expect(state.items).toHaveLength(0);
  });

  it("does not mutate the previous state", () => {
    const before = reducer(empty, addItem({ product: pillow }));
    const frozen = JSON.stringify(before);
    reducer(before, addItem({ product: pillow }));
    expect(JSON.stringify(before)).toBe(frozen);
  });
});

describe("cart selectors", () => {
  const cart = (items) => ({ cart: { items } });
  const line = (price, quantity) => ({ productId: price, price, quantity, stock: 99, name: "n", image: "i" });

  it("counts units and sums the subtotal", () => {
    const state = cart([line(100, 2), line(250, 1)]);
    expect(selectCartCount(state)).toBe(3);
    expect(selectSubtotal(state)).toBe(450);
  });

  it("charges 49 shipping below 999, and nothing at 999 or more", () => {
    expect(selectShippingFee(cart([line(500, 1)]))).toBe(49);
    expect(selectTotal(cart([line(500, 1)]))).toBe(549);
    expect(selectShippingFee(cart([line(999, 1)]))).toBe(0);
    expect(selectTotal(cart([line(999, 1)]))).toBe(999);
  });

  it("charges nothing for an empty cart", () => {
    expect(selectShippingFee(cart([]))).toBe(0);
    expect(selectTotal(cart([]))).toBe(0);
  });
});
