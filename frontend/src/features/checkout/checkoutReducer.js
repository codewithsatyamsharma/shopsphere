export const STEPS = ["Shipping", "Payment", "Review"];

export const initialCheckout = { step: 0, shipping: null, paymentMethod: "cod" };

// useReducer fits here because several values change together and the next state depends on the current step
export function checkoutReducer(state, action) {
  switch (action.type) {
    case "SAVE_SHIPPING":
      return { ...state, shipping: action.payload, step: 1 };
    case "SAVE_PAYMENT":
      return { ...state, paymentMethod: action.payload, step: 2 };
    case "BACK":
      return { ...state, step: Math.max(state.step - 1, 0) };
    case "GOTO":
      return { ...state, step: action.payload };
    default:
      return state;
  }
}
