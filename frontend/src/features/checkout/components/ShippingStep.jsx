import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { shippingSchema } from "../schemas";

export function ShippingStep({ defaultValues, onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(shippingSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-4 p-5">
      <h2 className="text-lg font-semibold">Shipping address</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} />
        <Input label="Mobile number" inputMode="numeric" autoComplete="tel" placeholder="10 digits" error={errors.phone?.message} {...register("phone")} />
      </div>
      <Input label="Address" autoComplete="street-address" error={errors.address?.message} {...register("address")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="City" autoComplete="address-level2" error={errors.city?.message} {...register("city")} />
        <Input label="Pincode" inputMode="numeric" autoComplete="postal-code" error={errors.pincode?.message} {...register("pincode")} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="lg">Continue to payment</Button>
      </div>
    </form>
  );
}
