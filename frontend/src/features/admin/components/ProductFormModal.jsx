import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Modal } from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { useApi } from "../../../hooks/useApi";
import { api, getErrorMessage, getFieldErrors } from "../../../lib/api";

// Number inputs always give text, so register() converts them (valueAsNumber / setValueAs below).
const productSchema = z
  .object({
    name: z.string().trim().min(3, "Name must be at least 3 characters").max(120, "Name is too long"),
    brand: z.string().trim().max(60, "Brand is too long"),
    categoryId: z.number({ invalid_type_error: "Choose a category" }).int().positive("Choose a category"),
    price: z.number({ invalid_type_error: "Enter a price" }).int("Use a whole number").positive("Price must be greater than 0"),
    originalPrice: z.number({ invalid_type_error: "Enter a valid number" }).int().positive().nullable(),
    stock: z.number({ invalid_type_error: "Enter the stock" }).int("Use a whole number").min(0, "Stock cannot be negative"),
    image: z.string().trim().url("Image must be a valid URL"),
    gallery: z.string(),
    description: z.string().trim().max(2000, "Description is too long"),
    isFeatured: z.boolean(),
  })
  .refine((d) => d.originalPrice == null || d.originalPrice >= d.price, {
    message: "Original price must be at least the selling price",
    path: ["originalPrice"],
  });

const EMPTY = {
  name: "", brand: "", categoryId: NaN, price: NaN, originalPrice: null, stock: NaN,
  image: "", gallery: "", description: "", isFeatured: false,
};

const toFormValues = (product) =>
  product
    ? {
        name: product.name,
        brand: product.brand,
        categoryId: product.category.id,
        price: product.price,
        originalPrice: product.originalPrice,
        stock: product.stock,
        image: product.image,
        gallery: product.images.join("\n"),
        description: product.description,
        isFeatured: product.isFeatured,
      }
    : EMPTY;

export function ProductFormModal({ open, product, onClose, onSaved }) {
  const { data: categories } = useApi("/categories", undefined, { enabled: open });
  const isEdit = Boolean(product);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(productSchema), defaultValues: EMPTY });

  // Fill the form when the modal opens (edit) or clear it (create)
  useEffect(() => {
    if (open) reset(toFormValues(product));
  }, [open, product, reset]);

  const onSubmit = async ({ gallery, ...values }) => {
    const payload = { ...values, images: gallery.split("\n").map((s) => s.trim()).filter(Boolean) };
    try {
      if (isEdit) await api.patch(`/products/${product.id}`, payload);
      else await api.post("/products", payload);
      toast.success(isEdit ? "Product updated" : "Product created");
      onSaved();
      onClose();
    } catch (error) {
      const known = Object.keys(EMPTY);
      const fieldErrors = getFieldErrors(error);
      if (fieldErrors.length) {
        fieldErrors.forEach(({ field, message }) =>
          setError(known.includes(field) ? field : field.startsWith("images") ? "gallery" : "root", { message }),
        );
      } else {
        setError("root", { message: getErrorMessage(error) });
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit product" : "New product"} size="xl">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" error={errors.name?.message} {...register("name")} />
          <Input label="Brand" error={errors.brand?.message} {...register("brand")} />
          <Select label="Category" error={errors.categoryId?.message} {...register("categoryId", { valueAsNumber: true })}>
            <option value="">Choose...</option>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Stock" type="number" min="0" error={errors.stock?.message} {...register("stock", { valueAsNumber: true })} />
          <Input label="Price (₹)" type="number" min="1" error={errors.price?.message} {...register("price", { valueAsNumber: true })} />
          <Input
            label="Original price (optional)"
            type="number"
            min="1"
            hint="Shown struck through, to display a discount"
            error={errors.originalPrice?.message}
            {...register("originalPrice", { setValueAs: (v) => (v === "" || v == null ? null : Number(v)) })}
          />
        </div>
        <Input label="Main image URL" type="url" placeholder="https://..." error={errors.image?.message} {...register("image")} />
        <Textarea label="Gallery image URLs (optional, one per line)" rows={3} error={errors.gallery?.message} {...register("gallery")} />
        <Textarea label="Description" rows={3} error={errors.description?.message} {...register("description")} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="accent-indigo-600" {...register("isFeatured")} />
          Show on the home page as a featured product
        </label>
        {errors.root && <p role="alert" className="text-sm text-red-600">{errors.root.message}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{isEdit ? "Save changes" : "Create product"}</Button>
        </div>
      </form>
    </Modal>
  );
}
