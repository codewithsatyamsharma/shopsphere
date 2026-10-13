import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { validate } from "../middleware/validate.js";
import { PRODUCT_COLUMNS, mapProduct } from "../utils/helpers.js";

const params = z.object({ productId: z.coerce.number().int().positive() });

export function wishlistRouter(db, { requireAuth }) {
  const router = Router();
  router.use(requireAuth); // every wishlist route needs a signed-in user

  router.get("/", (req, res) => {
    const rows = db
      .prepare(
        `SELECT ${PRODUCT_COLUMNS}, 1 AS is_wishlisted
         FROM wishlist w
         JOIN products p ON p.id = w.product_id
         JOIN categories c ON c.id = p.category_id
         WHERE w.user_id = ? AND p.is_active = 1
         ORDER BY w.created_at DESC`,
      )
      .all(req.user.id);
    res.json({ success: true, data: rows.map(mapProduct) });
  });

  // PUT is idempotent: calling it twice leaves the same result as calling it once
  router.put("/:productId", validate(params, "params"), (req, res) => {
    const { productId } = req.params;
    if (!db.prepare("SELECT 1 FROM products WHERE id = ? AND is_active = 1").get(productId)) {
      throw new ApiError(404, "Product not found.");
    }
    db.prepare("INSERT OR IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)").run(req.user.id, productId);
    res.json({ success: true, data: { productId, wishlisted: true } });
  });

  router.delete("/:productId", validate(params, "params"), (req, res) => {
    db.prepare("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?").run(req.user.id, req.params.productId);
    res.json({ success: true, data: { productId: req.params.productId, wishlisted: false } });
  });

  return router;
}
