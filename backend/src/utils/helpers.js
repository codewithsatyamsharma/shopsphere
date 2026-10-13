import { z } from "zod";

export const slugify = (text) =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(Math.ceil(total / limit), 1),
});

// Query strings arrive as text, and an empty "?page=" arrives as "".
// Treat blank values as "not provided" so they do not fail validation.
export const blankToUndefined = (schema) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

export const mapUser = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  createdAt: row.created_at,
});

// Columns every product query selects (join with categories as `c`)
export const PRODUCT_COLUMNS = `p.*, c.name AS category_name, c.slug AS category_slug`;

export const mapProduct = (row) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  price: row.price,
  originalPrice: row.original_price,
  discountPercent:
    row.original_price && row.original_price > row.price
      ? Math.round((1 - row.price / row.original_price) * 100)
      : 0,
  stock: row.stock,
  inStock: row.stock > 0,
  brand: row.brand,
  image: row.image,
  images: JSON.parse(row.images || "[]"),
  rating: row.rating_avg,
  reviewCount: row.rating_count,
  isFeatured: Boolean(row.is_featured),
  isActive: Boolean(row.is_active),
  category: { id: row.category_id, name: row.category_name, slug: row.category_slug },
  isWishlisted: Boolean(row.is_wishlisted),
  createdAt: row.created_at,
});

// Recalculate the cached average rating after a review is added or removed
export const refreshProductRating = (db, productId) =>
  db
    .prepare(
      `UPDATE products SET
         rating_avg = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = ?), 0),
         rating_count = (SELECT COUNT(*) FROM reviews WHERE product_id = ?)
       WHERE id = ?`,
    )
    .run(productId, productId, productId);
