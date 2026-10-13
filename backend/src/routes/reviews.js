import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { validate } from "../middleware/validate.js";
import { blankToUndefined, buildPagination, refreshProductRating } from "../utils/helpers.js";

const productParams = z.object({ productId: z.coerce.number().int().positive() });
const reviewParams = z.object({ id: z.coerce.number().int().positive() });

const listQuery = z.object({
  page: blankToUndefined(z.coerce.number().int().min(1)),
  limit: blankToUndefined(z.coerce.number().int().min(1).max(20)),
});

const reviewBody = z.object({
  rating: z.coerce.number().int("Rating must be a whole number").min(1, "Rating must be 1 to 5").max(5, "Rating must be 1 to 5"),
  comment: z.string().trim().min(3, "Comment must be at least 3 characters").max(1000, "Comment is too long"),
});

// This router is mounted at /api, so it declares its own full paths
export function reviewsRouter(db, { optionalAuth, requireAuth }) {
  const router = Router();

  const activeProduct = (id) => db.prepare("SELECT id FROM products WHERE id = ? AND is_active = 1").get(id);

  router.get(
    "/products/:productId/reviews",
    optionalAuth,
    validate(productParams, "params"),
    validate(listQuery, "query"),
    (req, res) => {
      const { productId } = req.params;
      if (!activeProduct(productId)) throw new ApiError(404, "Product not found.");
      const page = req.query.page ?? 1;
      const limit = req.query.limit ?? 5;

      const { n: total } = db.prepare("SELECT COUNT(*) AS n FROM reviews WHERE product_id = ?").get(productId);
      const rows = db
        .prepare(
          `SELECT r.id, r.rating, r.comment, r.created_at, r.user_id, u.name AS user_name,
                  EXISTS (
                    SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
                    WHERE oi.product_id = r.product_id AND o.user_id = r.user_id
                      AND o.status IN ('paid', 'shipped', 'delivered')
                  ) AS verified
           FROM reviews r JOIN users u ON u.id = r.user_id
           WHERE r.product_id = ? ORDER BY r.created_at DESC, r.id DESC LIMIT ? OFFSET ?`,
        )
        .all(productId, limit, (page - 1) * limit);

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const row of db
        .prepare("SELECT rating, COUNT(*) AS n FROM reviews WHERE product_id = ? GROUP BY rating")
        .all(productId)) {
        distribution[row.rating] = row.n;
      }
      const { rating_avg: average } = db.prepare("SELECT rating_avg FROM products WHERE id = ?").get(productId);

      res.json({
        success: true,
        data: {
          reviews: rows.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.created_at,
            user: { id: r.user_id, name: r.user_name },
            verified: Boolean(r.verified),
            isMine: req.user?.id === r.user_id,
          })),
          summary: { average, count: total, distribution },
          pagination: buildPagination(page, limit, total),
        },
      });
    },
  );

  router.post(
    "/products/:productId/reviews",
    requireAuth,
    validate(productParams, "params"),
    validate(reviewBody),
    (req, res) => {
      const { productId } = req.params;
      if (!activeProduct(productId)) throw new ApiError(404, "Product not found.");
      if (db.prepare("SELECT 1 FROM reviews WHERE product_id = ? AND user_id = ?").get(productId, req.user.id)) {
        throw new ApiError(409, "You have already reviewed this product.");
      }
      const add = db.transaction(() => {
        const info = db
          .prepare("INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)")
          .run(productId, req.user.id, req.body.rating, req.body.comment);
        refreshProductRating(db, productId);
        return info.lastInsertRowid;
      });
      const id = add();
      res.status(201).json({
        success: true,
        message: "Thanks for your review!",
        data: { id, rating: req.body.rating, comment: req.body.comment, user: { id: req.user.id, name: req.user.name }, isMine: true },
      });
    },
  );

  router.delete("/reviews/:id", requireAuth, validate(reviewParams, "params"), (req, res) => {
    const review = db.prepare("SELECT * FROM reviews WHERE id = ?").get(req.params.id);
    if (!review) throw new ApiError(404, "Review not found.");
    if (review.user_id !== req.user.id && req.user.role !== "admin") {
      throw new ApiError(403, "You can only delete your own reviews.");
    }
    db.transaction(() => {
      db.prepare("DELETE FROM reviews WHERE id = ?").run(review.id);
      refreshProductRating(db, review.product_id);
    })();
    res.json({ success: true, message: "Review deleted." });
  });

  return router;
}
