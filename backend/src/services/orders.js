import { config } from "../config.js";
import { ApiError } from "../utils/ApiError.js";

export const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"];

// Which status changes are allowed. An order can never go backwards.
export const STATUS_TRANSITIONS = {
  pending: ["paid", "shipped", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const ORDER_SELECT = `
  SELECT o.*, u.name AS user_name, u.email AS user_email
  FROM orders o JOIN users u ON u.id = o.user_id`;

const mapItem = (row) => ({
  id: row.id,
  productId: row.product_id,
  name: row.name,
  image: row.image,
  price: row.price,
  quantity: row.quantity,
  lineTotal: row.price * row.quantity,
});

export const mapOrder = (row, items = []) => ({
  id: row.id,
  status: row.status,
  subtotal: row.subtotal,
  shippingFee: row.shipping_fee,
  total: row.total,
  paymentMethod: row.payment_method,
  shippingAddress: {
    name: row.ship_name,
    phone: row.ship_phone,
    address: row.ship_address,
    city: row.ship_city,
    pincode: row.ship_pincode,
  },
  items: items.map(mapItem),
  itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  customer: row.user_name ? { id: row.user_id, name: row.user_name, email: row.user_email } : undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Load items for many orders in ONE query instead of one query per order (the N+1 problem)
export function attachItems(db, orderRows) {
  if (orderRows.length === 0) return [];
  const ids = orderRows.map((row) => row.id);
  const items = db
    .prepare(`SELECT * FROM order_items WHERE order_id IN (${ids.map(() => "?").join(",")}) ORDER BY id`)
    .all(...ids);
  const byOrder = new Map();
  for (const item of items) {
    if (!byOrder.has(item.order_id)) byOrder.set(item.order_id, []);
    byOrder.get(item.order_id).push(item);
  }
  return orderRows.map((row) => mapOrder(row, byOrder.get(row.id) ?? []));
}

export function getOrder(db, orderId) {
  const row = db.prepare(`${ORDER_SELECT} WHERE o.id = ?`).get(orderId);
  if (!row) return null;
  return attachItems(db, [row])[0];
}

export const orderSelectSql = ORDER_SELECT;

// Creates an order inside ONE database transaction.
// If anything throws, every change (stock updates, inserts) is rolled back.
export function createOrder(db, userId, input) {
  // Merge duplicate lines: [{id:1,qty:1},{id:1,qty:2}] becomes {1 => 3}
  const wanted = new Map();
  for (const { productId, quantity } of input.items) {
    wanted.set(productId, (wanted.get(productId) ?? 0) + quantity);
  }

  const getProduct = db.prepare(
    "SELECT id, name, price, stock, image FROM products WHERE id = ? AND is_active = 1",
  );
  // The "AND stock >= ?" makes the check and the update one atomic step
  const reserveStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?");

  const run = db.transaction(() => {
    const lines = [];
    for (const [productId, quantity] of wanted) {
      const product = getProduct.get(productId);
      if (!product) throw new ApiError(400, `Product #${productId} is no longer available.`);
      if (quantity > config.maxUnitsPerProduct) {
        throw new ApiError(400, `You can order at most ${config.maxUnitsPerProduct} units of "${product.name}".`);
      }
      if (reserveStock.run(quantity, productId, quantity).changes === 0) {
        const message =
          product.stock === 0 ? `"${product.name}" is out of stock.` : `Only ${product.stock} left of "${product.name}".`;
        throw new ApiError(409, message, [{ field: "items", productId, available: product.stock, message }]);
      }
      // The price comes from the database. The client is never trusted for prices.
      lines.push({ ...product, productId, quantity });
    }

    const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
    const shippingFee = subtotal >= config.freeShippingThreshold ? 0 : config.shippingFee;
    const { shipping } = input;

    const info = db
      .prepare(
        `INSERT INTO orders (user_id, status, subtotal, shipping_fee, total, payment_method,
                             ship_name, ship_phone, ship_address, ship_city, ship_pincode)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        userId,
        input.paymentMethod === "cod" ? "pending" : "paid", // card and upi are "paid" in this mock
        subtotal,
        shippingFee,
        subtotal + shippingFee,
        input.paymentMethod,
        shipping.name,
        shipping.phone,
        shipping.address,
        shipping.city,
        shipping.pincode,
      );

    const insertItem = db.prepare(
      "INSERT INTO order_items (order_id, product_id, name, image, price, quantity) VALUES (?, ?, ?, ?, ?, ?)",
    );
    for (const line of lines) {
      insertItem.run(info.lastInsertRowid, line.productId, line.name, line.image, line.price, line.quantity);
    }
    return Number(info.lastInsertRowid);
  });

  return getOrder(db, run());
}

// Marks an order cancelled and puts its items back in stock (also one transaction)
export function cancelOrder(db, orderId) {
  const run = db.transaction(() => {
    db.prepare(
      "UPDATE orders SET status = 'cancelled', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?",
    ).run(orderId);
    const items = db.prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?").all(orderId);
    const restock = db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
    for (const item of items) restock.run(item.quantity, item.product_id);
  });
  run();
  return getOrder(db, orderId);
}
