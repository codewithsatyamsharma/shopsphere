import { useState } from "react";
import { Banknote, CreditCard, Smartphone } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

const METHODS = [
  { value: "cod", label: "Cash on delivery", hint: "Pay when your order arrives", icon: Banknote },
  { value: "card", label: "Credit / debit card", hint: "Visa, Mastercard, RuPay", icon: CreditCard },
  { value: "upi", label: "UPI", hint: "Google Pay, PhonePe, Paytm", icon: Smartphone },
];

export function PaymentStep({ value, onSubmit, onBack }) {
  const [method, setMethod] = useState(value);

  return (
    <div className="card space-y-4 p-5">
      <h2 className="text-lg font-semibold">Payment method</h2>
      <fieldset className="space-y-3">
        <legend className="sr-only">Choose a payment method</legend>
        {METHODS.map(({ value: v, label, hint, icon: Icon }) => (
          <label
            key={v}
            className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 ${
              method === v ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10" : "border-slate-200 dark:border-slate-700"
            }`}
          >
            <input type="radio" name="payment" value={v} checked={method === v} onChange={() => setMethod(v)} className="accent-indigo-600" />
            <Icon className="h-6 w-6 text-indigo-600" />
            <span>
              <span className="block text-sm font-medium">{label}</span>
              <span className="muted block text-xs">{hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {/* Demo only: these fields are never read or sent. Only the chosen method goes to the server. */}
      {method === "card" && (
        <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 dark:bg-slate-900">
          <Input className="sm:col-span-2" label="Card number" placeholder="4242 4242 4242 4242" inputMode="numeric" />
          <Input label="Expiry" placeholder="MM/YY" />
          <Input label="CVV" placeholder="123" inputMode="numeric" />
          <p className="muted text-xs sm:col-span-2">Demo only: nothing is charged and card details are never sent.</p>
        </div>
      )}
      {method === "upi" && (
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
          <Input label="UPI ID" placeholder="name@bank" />
          <p className="muted mt-2 text-xs">Demo only: nothing is charged.</p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <Button size="lg" onClick={() => onSubmit(method)}>Review order</Button>
      </div>
    </div>
  );
}
