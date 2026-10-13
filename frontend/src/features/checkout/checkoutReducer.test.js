import { checkoutReducer, initialCheckout } from "./checkoutReducer";

const address = { name: "A", phone: "9876543210", address: "12 MG Road", city: "Pune", pincode: "411001" };

describe("checkoutReducer", () => {
  it("moves through the steps and keeps the data", () => {
    let state = checkoutReducer(initialCheckout, { type: "SAVE_SHIPPING", payload: address });
    expect(state).toMatchObject({ step: 1, shipping: address });
    state = checkoutReducer(state, { type: "SAVE_PAYMENT", payload: "upi" });
    expect(state).toMatchObject({ step: 2, paymentMethod: "upi", shipping: address });
  });

  it("goes back without losing data, and never below step 0", () => {
    let state = checkoutReducer({ ...initialCheckout, step: 1, shipping: address }, { type: "BACK" });
    expect(state.step).toBe(0);
    expect(state.shipping).toEqual(address);
    expect(checkoutReducer(state, { type: "BACK" }).step).toBe(0);
  });

  it("can jump to a step (the Edit links on the review step)", () => {
    expect(checkoutReducer({ ...initialCheckout, step: 2 }, { type: "GOTO", payload: 0 }).step).toBe(0);
  });

  it("ignores unknown actions", () => {
    expect(checkoutReducer(initialCheckout, { type: "NOPE" })).toBe(initialCheckout);
  });
});
