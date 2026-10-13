import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { validate } from "../middleware/validate.js";
import { blankToUndefined, buildPagination } from "../utils/helpers.js";
import {
  ORDER_STATUSES,
  attachItems,
  cancelOrder,
  createOrder,
  getOrder,
  orderSelectSql,
} from "../services/orders.js";

const idParams = z.object({ id: z.coerce.number().int().positive() });

const listQuery = z.object({
  status: blankToUndefined(z.enum(ORDER_STATUSES)),
  page: blankToUndefined(z.coerce.number().int().min(1)),
  limit: blankToUndefined(z.coerce.number().int().min(1).max(50)),
});

const createSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int("Quantity must be a whole number").min(1, "Quantity must be at least 1").max(10, "Maximum 10 per item"),
      }),
    )
    .min(1, "Your cart is empty")
    .max(20, "Too many items in one order"),
  shipping: z.object({
    name: z.string().trim().min(2, "Enter the recipient's name").max(80),
    phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
    address: z.string().trim().min(5, "Enter the full address").max(200),
    city: z.string().trim().min(2, "Enter the city").max(60),
    pincode: z.string().trim().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  }),
  paymentMethod: z.enum(["cod", "card", "upi"], { errorMap: () => ({ message: "Choose a payment method" }) }),
});

export function ordersRouter(db, { requireAuth }) {
  const router = Router();
  router.use(requireAuth);

  router.post("/", validate(createSchema), (req, res) => {
    const order = createOrder(db, req.user.id, req.body);
    res.status(201).json({ success: true, message: "Order placed successfully.", data: order });
  });

  // Declared before "/:id" so "my" is not read as an id
  router.get("/my", validate(listQuery, "query"), (req, res) => {
    const { status } = req.query;
    const page = req.query.page ?? 1;
    const limit = req.query.limit ?? 10;
    const where = ["o.user_id = ?"];
    const params = [req.user.id];
    if (status) {
      where.push("o.status = ?");
      params.push(status);
    }
    const whereSql = `WHERE ${where.join(" AND ")}`;
    const { n: total } = db.prepare(`SELECT COUNT(*) AS n FROM orders o ${whereSql}`).get(...params);
    const rows = db
      .prepare(`${orderSelectSql} ${whereSql} ORDER BY o.created_at DESC, o.id DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, (page - 1) * limit);
    res.json({ success: true, data: { orders: attachItems(db, rows), pagination: buildPagination(page, limit, total) } });
  });

  router.get("/:id", validate(idParams, "params"), (req, res) => {
    const order = getOrder(db, req.params.id);
    // Someone else's order looks exactly like a missing one, so ids cannot be guessed
    if (!order || (order.customer.id !== req.user.id && req.user.role !== "admin")) {
      throw new ApiError(404, "Order not found.");
    }
    res.json({ success: true, data: order });
  });

  router.patch("/:id/cancel", validate(idParams, "params"), (req, res) => {
    const order = getOrder(db, req.params.id);
    if (!order || order.customer.id !== req.user.id) throw new ApiError(404, "Order not found.");
    if (!["pending", "paid"].includes(order.status)) {
      throw new ApiError(409, `A ${order.status} order can no longer be cancelled.`);
    }
    res.json({ success: true, message: "Order cancelled.", data: cancelOrder(db, order.id) });
  });

  return router;
}
