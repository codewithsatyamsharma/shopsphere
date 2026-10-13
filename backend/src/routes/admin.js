import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { validate } from "../middleware/validate.js";
import { blankToUndefined, buildPagination } from "../utils/helpers.js";
import {
  ORDER_STATUSES,
  STATUS_TRANSITIONS,
  attachItems,
  cancelOrder,
  getOrder,
  orderSelectSql,
} from "../services/orders.js";

const idParams = z.object({ id: z.coerce.number().int().positive() });
const statusBody = z.object({ status: z.enum(ORDER_STATUSES, { errorMap: () => ({ message: "Invalid order status" }) }) });
const orderListQuery = z.object({
  status: blankToUndefined(z.enum(ORDER_STATUSES)),
  search: blankToUndefined(z.string().trim().max(100)),
  page: blankToUndefined(z.coerce.number().int().min(1)),
  limit: blankToUndefined(z.coerce.number().int().min(1).max(50)),
});

const DAY = 24 * 60 * 60 * 1000;

export function adminRouter(db, { requireAdmin }) {
  const router = Router();
  router.use(requireAdmin); // one line protects every route below

  router.get("/stats", (_req, res) => {
    const totals = db
      .prepare("SELECT COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders FROM orders WHERE status != 'cancelled'")
      .get();
    const products = db.prepare("SELECT COUNT(*) AS n FROM products WHERE is_active = 1").get().n;
    const customers = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'user'").get().n;

    // Last 14 days, including days with no sales (so the chart has no gaps)
    const days = [];
    for (let i = 13; i >= 0; i -= 1) days.push(new Date(Date.now() - i * DAY).toISOString().slice(0, 10));
    const sales = new Map(
      db
        .prepare(
          `SELECT substr(created_at, 1, 10) AS date, COUNT(*) AS orders, SUM(total) AS revenue
           FROM orders WHERE status != 'cancelled' AND substr(created_at, 1, 10) >= ?
           GROUP BY date`,
        )
        .all(days[0])
        .map((row) => [row.date, row]),
    );
    const salesByDay = days.map((date) => ({
      date,
      orders: sales.get(date)?.orders ?? 0,
      revenue: sales.get(date)?.revenue ?? 0,
    }));

    const topProducts = db
      .prepare(
        `SELECT oi.product_id AS productId, MAX(oi.name) AS name, MAX(oi.image) AS image,
                SUM(oi.quantity) AS unitsSold, SUM(oi.quantity * oi.price) AS revenue
         FROM order_items oi JOIN orders o ON o.id = oi.order_id
         WHERE o.status != 'cancelled'
         GROUP BY oi.product_id ORDER BY unitsSold DESC, revenue DESC LIMIT 5`,
      )
      .all();

    const lowStock = db
      .prepare("SELECT id, name, image, stock FROM products WHERE is_active = 1 AND stock <= 5 ORDER BY stock ASC, id LIMIT 5")
      .all();

    const ordersByStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0]));
    for (const row of db.prepare("SELECT status, COUNT(*) AS n FROM orders GROUP BY status").all()) {
      ordersByStatus[row.status] = row.n;
    }

    res.json({
      success: true,
      data: {
        totals: { revenue: totals.revenue, orders: totals.orders, products, customers },
        salesByDay,
        topProducts,
        lowStock,
        ordersByStatus,
      },
    });
  });

  router.get("/orders", validate(orderListQuery, "query"), (req, res) => {
    const { status, search } = req.query;
    const page = req.query.page ?? 1;
    const limit = req.query.limit ?? 10;
    const where = [];
    const params = [];
    if (status) {
      where.push("o.status = ?");
      params.push(status);
    }
    if (search) {
      where.push("(CAST(o.id AS TEXT) = ? OR u.name LIKE ? OR u.email LIKE ?)");
      params.push(search, `%${search}%`, `%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const { n: total } = db
      .prepare(`SELECT COUNT(*) AS n FROM orders o JOIN users u ON u.id = o.user_id ${whereSql}`)
      .get(...params);
    const rows = db
      .prepare(`${orderSelectSql} ${whereSql} ORDER BY o.created_at DESC, o.id DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, (page - 1) * limit);
    res.json({ success: true, data: { orders: attachItems(db, rows), pagination: buildPagination(page, limit, total) } });
  });

  router.patch("/orders/:id/status", validate(idParams, "params"), validate(statusBody), (req, res) => {
    const order = getOrder(db, req.params.id);
    if (!order) throw new ApiError(404, "Order not found.");
    const next = req.body.status;
    if (!STATUS_TRANSITIONS[order.status].includes(next)) {
      throw new ApiError(409, `An order cannot move from "${order.status}" to "${next}".`);
    }
    if (next === "cancelled") {
      return res.json({ success: true, message: "Order cancelled and stock restored.", data: cancelOrder(db, order.id) });
    }
    db.prepare("UPDATE orders SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?").run(next, order.id);
    res.json({ success: true, message: `Order marked as ${next}.`, data: getOrder(db, order.id) });
  });

  return router;
}
