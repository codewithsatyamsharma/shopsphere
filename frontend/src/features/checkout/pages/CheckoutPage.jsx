import { useReducer, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Button } from "../../../components/ui/Button";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { api, getErrorMessage } from "../../../lib/api";
import { OrderSummary } from "../../cart/components/OrderSummary";
import { clearCart, selectCartItems, setStock } from "../../cart/cartSlice";
import { checkoutReducer, initialCheckout } from "../checkoutReducer";
import { PaymentStep } from "../components/PaymentStep";
import { ShippingStep } from "../components/ShippingStep";
import { Stepper } from "../components/Stepper";

const PAYMENT_LABELS = { cod: "Cash on delivery", card: "Credit / debit card", upi: "UPI" };

export default function CheckoutPage() {
  useDocumentTitle("Checkout");
  const dispatch = useDispatch(); // Redux
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const items = useSelector(selectCartItems);
  const [state, step] = useReducer(checkoutReducer, initialCheckout); // local wizard state
  const [placing, setPlacing] = useState(false);
  const placed = useRef(false); // true once the order succeeded, so the empty cart does not redirect us

  if (items.length === 0 && !placed.current) return <Navigate to="/cart" replace />;

  const placeOrder = async () => {
    if (placing) return; // guards against a double click creating two orders
    setPlacing(true);
    try {
      const { data } = await api.post("/orders", {
        // Only ids and quantities are sent. The server looks up the real prices.
        items: items.map(({ productId, quantity }) => ({ productId, quantity })),
        shipping: state.shipping,
        paymentMethod: state.paymentMethod,
      });
      placed.current = true;
      dispatch(clearCart());
      toast.success("Order placed successfully!");
      navigate(`/orders/${data.data.id}`, { replace: true, state: { justPlaced: true } });
    } catch (error) {
      const conflict = error.response?.status === 409 ? error.response.data.errors?.[0] : null;
      if (conflict?.productId) {
        // Someone bought the last units first. Correct the cart so the user can try again.
        dispatch(setStock({ productId: conflict.productId, stock: conflict.available }));
        toast.error(conflict.message);
        navigate("/cart");
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>
      <Stepper current={state.step} />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {state.step === 0 && (
            <ShippingStep
              defaultValues={state.shipping ?? { name: user.name, phone: "", address: "", city: "", pincode: "" }}
              onSubmit={(values) => step({ type: "SAVE_SHIPPING", payload: values })}
            />
          )}
          {state.step === 1 && (
            <PaymentStep
              value={state.paymentMethod}
              onBack={() => step({ type: "BACK" })}
              onSubmit={(method) => step({ type: "SAVE_PAYMENT", payload: method })}
            />
          )}
          {state.step === 2 && (
            <div className="card space-y-5 p-5">
              <h2 className="text-lg font-semibold">Review your order</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-900">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold">Ship to</h3>
                    <button className="link text-xs" onClick={() => step({ type: "GOTO", payload: 0 })}>Edit</button>
                  </div>
                  <p>{state.shipping.name}</p>
                  <p className="muted">{state.shipping.address}</p>
                  <p className="muted">{state.shipping.city} {state.shipping.pincode}</p>
                  <p className="muted">{state.shipping.phone}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-900">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold">Payment</h3>
                    <button className="link text-xs" onClick={() => step({ type: "GOTO", payload: 1 })}>Edit</button>
                  </div>
                  <p>{PAYMENT_LABELS[state.paymentMethod]}</p>
                  {state.paymentMethod === "cod" && <p className="muted">Pay when your order arrives</p>}
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => step({ type: "BACK" })} disabled={placing}>Back</Button>
                <Button size="lg" onClick={placeOrder} loading={placing}>Place order</Button>
              </div>
            </div>
          )}
        </div>
        <OrderSummary showItems />
      </div>
    </div>
  );
}
