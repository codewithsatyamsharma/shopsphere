import { Router } from "express";

export function categoriesRouter(db) {
  const router = Router();

  router.get("/", (_req, res) => {
    const rows = db
      .prepare(
        `SELECT c.id, c.name, c.slug,
                (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) AS product_count
         FROM categories c ORDER BY c.name`,
      )
      .all();
    res.json({
      success: true,
      data: rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug, productCount: r.product_count })),
    });
  });

  return router;
}
