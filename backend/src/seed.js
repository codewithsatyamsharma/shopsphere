import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";
import { createDb } from "./db.js";
import { refreshProductRating, slugify } from "./utils/helpers.js";

export const DEMO_ADMIN = { email: "admin@shopsphere.local", password: "Admin@123" };
export const DEMO_USER = { email: "demo@shopsphere.local", password: "Demo@1234" };

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

// Small seeded random generator so every reset produces the same data
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CATEGORIES = ["Electronics", "Fashion", "Home & Kitchen", "Books", "Sports & Fitness"];

// [name, brand, price, originalPrice, stock, category, featured, description]
const PRODUCTS = [
  ["Aurora Wireless Headphones", "Sonique", 2999, 4999, 45, "Electronics", 1, "Over-ear Bluetooth headphones with active noise cancellation and 30 hours of battery life."],
  ["Pulse Smartwatch S2", "Zenith", 3499, 5999, 30, "Electronics", 1, "AMOLED smartwatch with heart-rate tracking, GPS and 7-day battery."],
  ["Volt 20000mAh Power Bank", "Chargex", 1499, 1999, 80, "Electronics", 0, "Fast-charging power bank with two USB-C ports and a compact aluminium body."],
  ["Lumen Mechanical Keyboard", "KeyForge", 3999, null, 18, "Electronics", 1, "Hot-swappable mechanical keyboard with per-key RGB lighting and tactile switches."],
  ["Classic Denim Jacket", "Urbanite", 2499, 3499, 25, "Fashion", 0, "Mid-weight denim jacket with a relaxed fit that works across seasons."],
  ["Everyday Cotton T-Shirt (Pack of 3)", "Basica", 899, 1299, 120, "Fashion", 0, "Soft 100% cotton crew-neck tees in three neutral colours."],
  ["Trail Running Sneakers", "Strider", 2799, 3999, 40, "Fashion", 1, "Lightweight sneakers with a grippy sole and breathable mesh upper."],
  ["Canvas Backpack 25L", "Wanderly", 1299, 1799, 60, "Fashion", 0, "Water-resistant canvas backpack with a padded 15-inch laptop sleeve."],
  ["Brew Master Coffee Maker", "HomeCraft", 4299, 5499, 15, "Home & Kitchen", 1, "Programmable drip coffee maker with a thermal carafe and a built-in grinder."],
  ["Non-Stick Cookware Set (5 pc)", "Cookwell", 2199, 3299, 35, "Home & Kitchen", 0, "Five-piece induction-friendly cookware set with a scratch-resistant coating."],
  ["Ceramic Table Lamp", "Lumos", 1199, null, 22, "Home & Kitchen", 0, "Hand-finished ceramic base with a linen shade and warm LED bulb included."],
  ["Memory Foam Pillow", "DreamCloud", 799, 1199, 90, "Home & Kitchen", 0, "Contoured memory foam pillow that keeps its shape and supports your neck."],
  ["Clean Code", "Robert C. Martin", 649, 899, 55, "Books", 1, "A handbook of agile software craftsmanship for writing readable, maintainable code."],
  ["The Pragmatic Programmer", "Hunt & Thomas", 749, 999, 40, "Books", 0, "Practical advice on becoming a more effective and adaptable software developer."],
  ["Atomic Habits", "James Clear", 499, 699, 100, "Books", 1, "An easy, proven way to build good habits and break bad ones."],
  ["Deep Work", "Cal Newport", 449, 649, 70, "Books", 0, "Rules for focused success in a distracted world."],
  ["Yoga Mat Pro 6mm", "FlexFit", 999, 1499, 70, "Sports & Fitness", 0, "Non-slip 6mm yoga mat with alignment lines and a carry strap."],
  ["Adjustable Dumbbell Set 20kg", "IronCore", 3299, 4499, 5, "Sports & Fitness", 1, "Adjustable dumbbells with a quick-lock system, ideal for home workouts."],
  ["Insulated Steel Bottle 1L", "HydroPeak", 699, 999, 150, "Sports & Fitness", 0, "Double-wall vacuum bottle that keeps drinks cold for 24 hours or hot for 12."],
  ["Resistance Bands Set", "FlexFit", 599, 899, 3, "Sports & Fitness", 0, "Set of five latex resistance bands with handles, door anchor and carry bag."],
];

const COMMENTS = {
  5: ["Absolutely love it. Exactly as described and arrived quickly.", "Great quality for the price. Highly recommended!", "Better than I expected. Would buy again."],
  4: ["Really good overall. Only minor nitpicks.", "Solid product and good value for money.", "Happy with this purchase. Packaging could be better."],
  3: ["It is okay. Does the job but nothing special.", "Average quality. Fine for the price."],
};

const CUSTOMERS = [
  ["Demo Customer", DEMO_USER.email],
  ["Aarav Sharma", "aarav@shopsphere.local"],
  ["Sneha Iyer", "sneha@shopsphere.local"],
  ["Rohan Gupta", "rohan@shopsphere.local"],
  ["Priya Nair", "priya@shopsphere.local"],
];

const CITIES = [["Pune", "411001"], ["Mumbai", "400001"], ["Bengaluru", "560001"], ["Delhi", "110001"], ["Nashik", "422001"]];

export function resetDatabase(db) {
  db.pragma("foreign_keys = OFF");
  for (const table of ["order_items", "orders", "wishlist", "reviews", "products", "categories", "users"]) {
    db.exec(`DELETE FROM ${table}`);
  }
  db.exec("DELETE FROM sqlite_sequence");
  db.pragma("foreign_keys = ON");
}

export function seedDatabase(db, { reset = false } = {}) {
  if (reset) resetDatabase(db);
  const random = mulberry32(42);
  const pick = (list) => list[Math.floor(random() * list.length)];

  db.transaction(() => {
    // Users
    const insertUser = db.prepare("INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)");
    insertUser.run("Shop Admin", DEMO_ADMIN.email, bcrypt.hashSync(DEMO_ADMIN.password, 10), "admin", new Date(Date.now() - 60 * DAY).toISOString());
    const customerHash = bcrypt.hashSync(DEMO_USER.password, 10); // same password for every demo customer
    const customerIds = CUSTOMERS.map(([name, email], i) =>
      Number(insertUser.run(name, email, customerHash, "user", new Date(Date.now() - (50 - i * 5) * DAY).toISOString()).lastInsertRowid),
    );

    // Categories
    const insertCategory = db.prepare("INSERT INTO categories (name, slug) VALUES (?, ?)");
    const categoryId = Object.fromEntries(
      CATEGORIES.map((name) => [name, Number(insertCategory.run(name, slugify(name)).lastInsertRowid)]),
    );

    // Products. Images come from picsum.photos, which returns the same photo for the same seed word.
    const insertProduct = db.prepare(
      `INSERT INTO products (name, slug, description, price, original_price, stock, category_id, brand,
                             image, images, is_featured, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const productIds = [];
    PRODUCTS.forEach(([name, brand, price, original, stock, category, featured, description], i) => {
      const slug = slugify(name);
      const photo = (suffix) => `https://picsum.photos/seed/${slug}${suffix}/600/600`;
      const info = insertProduct.run(
        name, slug, description, price, original, stock, categoryId[category], brand,
        photo(""), JSON.stringify([photo("-1"), photo("-2"), photo("-3")]), featured,
        new Date(Date.now() - i * 0.6 * DAY).toISOString(),
      );
      productIds.push({ id: Number(info.lastInsertRowid), name, price });
    });

    // Reviews
    const insertReview = db.prepare("INSERT INTO reviews (product_id, user_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?)");
    for (const product of productIds) {
      for (const userId of customerIds) {
        if (random() < 0.55) {
          const rating = pick([5, 5, 5, 4, 4, 3]);
          insertReview.run(product.id, userId, rating, pick(COMMENTS[rating]), new Date(Date.now() - Math.floor(random() * 30) * DAY).toISOString());
        }
      }
      refreshProductRating(db, product.id);
    }

    // About 45 orders spread over the last 14 days, so the admin charts are not empty
    const insertOrder = db.prepare(
      `INSERT INTO orders (user_id, status, subtotal, shipping_fee, total, payment_method, ship_name, ship_phone,
                           ship_address, ship_city, ship_pincode, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertItem = db.prepare("INSERT INTO order_items (order_id, product_id, name, image, price, quantity) VALUES (?, ?, ?, ?, ?, ?)");
    for (let i = 0; i < 45; i += 1) {
      const dayOffset = Math.floor(random() * 14);
      const createdAt = new Date(Date.now() - dayOffset * DAY - Math.floor(random() * 10) * HOUR).toISOString();
      const lines = Array.from({ length: 1 + Math.floor(random() * 3) }, () => ({ ...pick(productIds), quantity: 1 + Math.floor(random() * 2) }));
      const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
      const shippingFee = subtotal >= 999 ? 0 : 49;
      const old = dayOffset >= 5;
      const status = random() < 0.08 ? "cancelled" : old ? pick(["delivered", "delivered", "shipped"]) : pick(["paid", "pending", "shipped"]);
      const [city, pincode] = pick(CITIES);
      const userId = pick(customerIds);
      const customer = CUSTOMERS[customerIds.indexOf(userId)];
      const info = insertOrder.run(
        userId, status, subtotal, shippingFee, subtotal + shippingFee, pick(["cod", "card", "upi"]),
        customer[0], "9876543210", "12 MG Road, Near City Mall", city, pincode, createdAt, createdAt,
      );
      for (const line of lines) {
        insertItem.run(info.lastInsertRowid, line.id, line.name, `https://picsum.photos/seed/${slugify(line.name)}/600/600`, line.price, line.quantity);
      }
    }
  })();
}

// "npm run seed" runs this file directly and wipes the old data first
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const db = createDb();
  seedDatabase(db, { reset: process.argv.includes("--reset") });
  console.log("Seeded. Admin:", DEMO_ADMIN.email, "/", DEMO_ADMIN.password, "| Customer:", DEMO_USER.email, "/", DEMO_USER.password);
  db.close();
}
