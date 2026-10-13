import { z } from "zod";

export const shippingSchema = z.object({
  name: z.string().trim().min(2, "Enter the recipient's name").max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  address: z.string().trim().min(5, "Enter the full address").max(200),
  city: z.string().trim().min(2, "Enter the city").max(60),
  pincode: z.string().trim().regex(/^\d{6}$/, "Pincode must be 6 digits"),
});
