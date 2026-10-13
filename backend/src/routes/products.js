import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { validate } from "../middleware/validate.js";
import {
  PRODUCT_COLUMNS,
  blankToUndefined,
  buildPagination,
  mapProduct,
  slugify,
} from "../utils/helpers.js";

const idParams = z.object({ id: z.coerce.number().int().positive() });

const listQuery = z.object({
  search: blankToUndefined(z.string().trim().max(100)),
  category: blankToUndefined(z.string().trim().max(60)), // category slug
  minPrice: blankToUndefined(z.coerce.number().int().min(0)),
  maxPrice: blankToUndefined(z.coerce.number().int().min(0)),
  minRating: blankToUndefined(z.coerce.number().min(0).max(5)),
  inStock: blankToUndefined(z.enum(["true", "false"])),
  includeInactive: blankToUndefined(z.enum(["true", "false"])), // admins only
  sort: blankToUndefined(z.enum(["newest", "price_asc", "price_desc", "rating", "popular"])),
  page: blankToUndefined(z.coerce.number().int().min(1)),
  limit: blankToUndefined(z.coerce.number().int().min(1).max(50)),
});

// Never put user input into ORDER BY. Map a fixed list of keys to SQL instead.
const ORDER_BY = {
  newest: "p.created_at DESC, p.id DESC",
  price_asc: "p.price ASC, p.id ASC",
  price_desc: "p.price DESC, p.id ASC",
  rating: "p.rating_avg DESC, p.rating_count DESC, p.id ASC",
  popular: `(SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.product_id = p.id) DESC, p.id ASC`,
};

const productShape = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(120, "Name is too long"),
  description: z.string().trim().max(2000, "Description is too long"),
  price: z.coerce.number().int("Price must be a whole number").positive("Price must be greater than 0"),
  originalPrice: z.coerce.number().int().positive().nullable(),
  stock: z.coerce.number().int("Stock must be a whole number").min(0, "Stock cannot be negative"),
  categoryId: z.coerce.number().int().positive("Choose a category"),
  brand: z.string().trim().max(60),
  image: z.string().trim().url("Image must be a valid URL"),
  images: z.array(z.string().trim().url("Each gallery image must be a valid URL")).max(6),
  isFeatured: z.boolean(),
});

const createSchema = productShape
  .partial({ description: true, originalPrice: true, brand: true, images: true, isFeatured: true });

const updateSchema = productShape
  .partial()
  .extend({ isActive: z.boolean().optional() })
  .refine((data) => Object.keys(data).length > 0, { message: "Send at least one field to update." });

const COLUMN_FOR = {
  name: "name",
  description: "description",
  price: "price",
  originalPrice: "original_price",
  stock: "stock",
  categoryId: "category_id",
  brand: "brand",
  image: "image",
  isFeatured: "is_featured",
  isActive: "is_active",
};

export function productsRouter(db, { optionalAuth, requireAdmin }) {
  const router = Router();

  const selectOne = (id, userId, includeInactive) =>
    db
      .prepare(
        `SELECT ${PRODUCT_COLUMNS},
                EXISTS (SELECT 1 FROM wishlist w WHERE w.product_id = p.id AND w.user_id = ?) AS is_wishlisted
         FROM products p JOIN categories c ON c.id = p.category_id
         WHERE p.id = ? AND (p.is_active = 1 OR ?)`,
      )
      .get(userId ?? null, id, includeInactive ? 1 : 0);

  const uniqueSlug = (name) => {
    const base = slugify(name) || "product";
    let slug = base;
    let n = 2;
    while (db.prepare("SELECT 1 FROM products WHERE slug = ?").get(slug)) slug = `${base}-${n++}`;
    return slug;
  };

  // GET /api/products?search=&category=&minPrice=&maxPrice=&minRating=&inStock=&sort=&page=&limit=
  router.get("/", optionalAuth, validate(listQuery, "query"), (req, res) => {
    const q = req.query;
    const page = q.page ?? 1;
    const limit = q.limit ?? 12;
    const sort = q.sort ?? "newest";
    const isAdmin = req.user?.role === "admin";

    const where = [];
    const params = [];
    if (!(q.includeInactive === "true" && isAdmin)) where.push("p.is_active = 1");
    if (q.search) {
      where.push("(p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)");
      params.push(`%${q.search}%`, `%${q.search}%`, `%${q.search}%`);
    }
    if (q.category) {
      where.push("c.slug = ?");
      params.push(q.category);
    }
    if (q.minPrice !== undefined) {
      where.push("p.price >= ?");
      params.push(q.minPrice);
    }
    if (q.maxPrice !== undefined) {
      where.push("p.price <= ?");
      params.push(q.maxPrice);
    }
    if (q.minRating !== undefined) {
      where.push("p.rating_avg >= ?");
      params.push(q.minRating);
    }
    if (q.inStock === "true") where.push("p.stock > 0");

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const from = `FROM products p JOIN categories c ON c.id = p.category_id ${whereSql}`;

    const { n: total } = db.prepare(`SELECT COUNT(*) AS n ${from}`).get(...params);
    const rows = db
      .prepare(
        `SELECT ${PRODUCT_COLUMNS},
                EXISTS (SELECT 1 FROM wishlist w WHERE w.product_id = p.id AND w.user_id = ?) AS is_wishlisted
         ${from} ORDER BY ${ORDER_BY[sort]} LIMIT ? OFFSET ?`,
      )
      .all(req.user?.id ?? null, ...params, limit, (page - 1) * limit);

    res.json({
      success: true,
      data: { products: rows.map(mapProduct), pagination: buildPagination(page, limit, total) },
    });
  });

  // Must be declared before "/:id", otherwise "featured" would be treated as an id
  router.get("/featured", optionalAuth, (req, res) => {
    const rows = db
      .prepare(
        `SELECT ${PRODUCT_COLUMNS},
                EXISTS (SELECT 1 FROM wishlist w WHERE w.product_id = p.id AND w.user_id = ?) AS is_wishlisted
         FROM products p JOIN categories c ON c.id = p.category_id
         WHERE p.is_active = 1 AND p.is_featured = 1 ORDER BY p.rating_avg DESC, p.id LIMIT 8`,
      )
      .all(req.user?.id ?? null);
    res.json({ success: true, data: rows.map(mapProduct) });
  });

  router.get("/:id", optionalAuth, validate(idParams, "params"), (req, res) => {
    const row = selectOne(req.params.id, req.user?.id, req.user?.role === "admin");
    if (!row) throw new ApiError(404, "Product not found.");
    res.json({ success: true, data: mapProduct(row) });
  });

  router.get("/:id/related", optionalAuth, validate(idParams, "params"), (req, res) => {
    const product = db.prepare("SELECT category_id FROM products WHERE id = ?").get(req.params.id);
    if (!product) throw new ApiError(404, "Product not found.");
    const rows = db
      .prepare(
        `SELECT ${PRODUCT_COLUMNS},
                EXISTS (SELECT 1 FROM wishlist w WHERE w.product_id = p.id AND w.user_id = ?) AS is_wishlisted
         FROM products p JOIN categories c ON c.id = p.category_id
         WHERE p.is_active = 1 AND p.category_id = ? AND p.id != ?
         ORDER BY p.rating_avg DESC, p.id LIMIT 4`,
      )
      .all(req.user?.id ?? null, product.category_id, req.params.id);
    res.json({ success: true, data: rows.map(mapProduct) });
  });

  /* ------------------------------ Admin only ------------------------------ */

  router.post("/", requireAdmin, validate(createSchema), (req, res) => {
    const b = req.body;
    if (!db.prepare("SELECT 1 FROM categories WHERE id = ?").get(b.categoryId)) {
      throw new ApiError(400, "Category does not exist.", [{ field: "categoryId", message: "Category does not exist." }]);
    }
    if (b.originalPrice != null && b.originalPrice < b.price) {
      throw new ApiError(400, "Original price must be at least the selling price.", [
        { field: "originalPrice", message: "Original price must be at least the selling price." },
      ]);
    }
    const info = db
      .prepare(
        `INSERT INTO products (name, slug, description, price, original_price, stock, category_id,
                               brand, image, images, is_featured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        b.name,
        uniqueSlug(b.name),
        b.description ?? "",
        b.price,
        b.originalPrice ?? null,
        b.stock,
        b.categoryId,
        b.brand ?? "",
        b.image,
        JSON.stringify(b.images ?? []),
        b.isFeatured ? 1 : 0,
      );
    res.status(201).json({ success: true, message: "Product created.", data: mapProduct(selectOne(info.lastInsertRowid, null, true)) });
  });

  router.patch("/:id", requireAdmin, validate(idParams, "params"), validate(updateSchema), (req, res) => {
    const current = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
    if (!current) throw new ApiError(404, "Product not found.");

    const b = req.body;
    if (b.categoryId !== undefined && !db.prepare("SELECT 1 FROM categories WHERE id = ?").get(b.categoryId)) {
      throw new ApiError(400, "Category does not exist.", [{ field: "categoryId", message: "Category does not exist." }]);
    }
    const price = b.price ?? current.price;
    const originalPrice = b.originalPrice !== undefined ? b.originalPrice : current.original_price;
    if (originalPrice != null && originalPrice < price) {
      throw new ApiError(400, "Original price must be at least the selling price.", [
        { field: "originalPrice", message: "Original price must be at least the selling price." },
      ]);
    }

    // Build "SET column = ?" only for the fields that were actually sent
    const sets = [];
    const values = [];
    for (const [key, column] of Object.entries(COLUMN_FOR)) {
      if (b[key] === undefined) continue;
      sets.push(`${column} = ?`);
      values.push(typeof b[key] === "boolean" ? (b[key] ? 1 : 0) : b[key]);
    }
    if (b.images !== undefined) {
      sets.push("images = ?");
      values.push(JSON.stringify(b.images));
    }
    db.prepare(`UPDATE products SET ${sets.join(", ")} WHERE id = ?`).run(...values, req.params.id);

    res.json({ success: true, message: "Product updated.", data: mapProduct(selectOne(req.params.id, null, true)) });
  });

  // Soft delete: old orders still point at this product, so we hide it instead of removing the row
  router.delete("/:id", requireAdmin, validate(idParams, "params"), (req, res) => {
    const info = db.prepare("UPDATE products SET is_active = 0 WHERE id = ? AND is_active = 1").run(req.params.id);
    if (info.changes === 0) throw new ApiError(404, "Product not found.");
    res.json({ success: true, message: "Product archived." });
  });

  return router;
}
