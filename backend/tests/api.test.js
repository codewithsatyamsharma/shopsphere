// Run with: npm test
// These tests start the real app on a random port with an in-memory database.
process.env.NODE_ENV = "test";

import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";

const { createDb } = await import("../src/db.js");
const { createApp } = await import("../src/app.js");
const { seedDatabase, DEMO_ADMIN, DEMO_USER } = await import("../src/seed.js");

let server;
let base;

before(() => {
  const db = createDb(":memory:");
  seedDatabase(db);
  server = createApp(db).listen(0);
  base = `http://localhost:${server.address().port}/api`;
});

after(() => server.close());

// A tiny client that keeps cookies, like a browser would
function client() {
  let cookie = "";
  const call = async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json", ...(cookie && { Cookie: cookie }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const setCookie = res.headers.getSetCookie().find((c) => c.startsWith("token="));
    if (setCookie) cookie = setCookie.split(";")[0] === "token=" ? "" : setCookie.split(";")[0];
    let json = null;
    try {
      json = await res.json();
    } catch {}
    return { status: res.status, body: json, setCookie };
  };
  return {
    get: (p) => call("GET", p),
    post: (p, b = {}) => call("POST", p, b),
    patch: (p, b = {}) => call("PATCH", p, b),
    put: (p, b = {}) => call("PUT", p, b),
    del: (p) => call("DELETE", p),
    raw: call,
  };
}

let counter = 0;
async function newUser() {
  counter += 1;
  const c = client();
  const res = await c.post("/auth/register", {
    name: `Test User ${counter}`,
    email: `tester${counter}@example.com`,
    password: "Passw0rd!",
  });
  assert.equal(res.status, 201);
  return c;
}

async function loginAs({ email, password }) {
  const c = client();
  const res = await c.post("/auth/login", { email, password });
  assert.equal(res.status, 200, `login failed for ${email}`);
  return c;
}

const findProduct = async (c, search) => (await c.get(`/products?search=${encodeURIComponent(search)}`)).body.data.products[0];

const shipping = { name: "Test User", phone: "9876543210", address: "12 MG Road", city: "Pune", pincode: "411001" };

describe("basics", () => {
  test("health check and unknown route", async () => {
    const c = client();
    assert.equal((await c.get("/health")).body.data.status, "ok");
    const missing = await c.get("/nope");
    assert.equal(missing.status, 404);
    assert.equal(missing.body.success, false);
  });

  test("invalid JSON body returns 400, not a crash", async () => {
    const res = await fetch(`${base}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{bad" });
    assert.equal(res.status, 400);
  });
});

describe("auth", () => {
  test("register validates input and returns field errors", async () => {
    const res = await client().post("/auth/register", { name: "A", email: "nope", password: "short" });
    assert.equal(res.status, 400);
    const fields = res.body.errors.map((e) => e.field);
    assert.ok(fields.includes("name") && fields.includes("email") && fields.includes("password"));
  });

  test("register sets an httpOnly cookie and never returns the password hash", async () => {
    const c = client();
    const res = await c.post("/auth/register", { name: "Cookie Test", email: "cookie@example.com", password: "Passw0rd!" });
    assert.equal(res.status, 201);
    assert.match(res.setCookie, /HttpOnly/i);
    assert.equal(res.body.data.role, "user");
    assert.equal(res.body.data.password_hash, undefined);
    assert.equal(res.body.data.password, undefined);
  });

  test("duplicate email is rejected, case-insensitively", async () => {
    const res = await client().post("/auth/register", { name: "Dupe", email: "COOKIE@example.com", password: "Passw0rd!" });
    assert.equal(res.status, 409);
    assert.equal(res.body.errors[0].field, "email");
  });

  test("login: wrong password and unknown email give the same message", async () => {
    const wrongPassword = await client().post("/auth/login", { email: DEMO_USER.email, password: "Wrong1234" });
    const unknownEmail = await client().post("/auth/login", { email: "ghost@example.com", password: "Wrong1234" });
    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    assert.equal(wrongPassword.body.message, unknownEmail.body.message);
  });

  test("me requires a session; logout ends it", async () => {
    assert.equal((await client().get("/auth/me")).status, 401);
    const c = await loginAs(DEMO_USER);
    const me = await c.get("/auth/me");
    assert.equal(me.status, 200);
    assert.equal(me.body.data.email, DEMO_USER.email);
    await c.post("/auth/logout");
    assert.equal((await c.get("/auth/me")).status, 401);
  });

  test("a tampered token is rejected", async () => {
    const res = await fetch(`${base}/auth/me`, { headers: { Cookie: "token=abc.def.ghi" } });
    assert.equal(res.status, 401);
  });

  test("update profile and change password", async () => {
    const c = await newUser();
    assert.equal((await c.patch("/auth/me", { name: "New Name" })).body.data.name, "New Name");
    const wrong = await c.patch("/auth/password", { currentPassword: "Nope12345", newPassword: "Another123" });
    assert.equal(wrong.status, 400);
    assert.equal(wrong.body.errors[0].field, "currentPassword");
    const ok = await c.patch("/auth/password", { currentPassword: "Passw0rd!", newPassword: "Another123" });
    assert.equal(ok.status, 200);
    const relog = client();
    assert.equal((await relog.post("/auth/login", { email: (await c.get("/auth/me")).body.data.email, password: "Another123" })).status, 200);
  });
});

describe("products", () => {
  test("list is paginated", async () => {
    const res = await client().get("/products");
    assert.equal(res.status, 200);
    const { products, pagination } = res.body.data;
    assert.equal(products.length, 12);
    assert.deepEqual(pagination, { page: 1, limit: 12, total: 20, totalPages: 2 });
    const page2 = await client().get("/products?page=2");
    assert.equal(page2.body.data.products.length, 8);
  });

  test("product shape", async () => {
    const p = (await client().get("/products?limit=1")).body.data.products[0];
    for (const key of ["id", "name", "price", "originalPrice", "discountPercent", "stock", "inStock", "image", "images", "rating", "reviewCount", "category", "isWishlisted"]) {
      assert.ok(key in p, `missing ${key}`);
    }
    assert.ok(Array.isArray(p.images));
  });

  test("search, category, price range, rating and stock filters", async () => {
    const c = client();
    assert.equal((await c.get("/products?search=keyboard")).body.data.products.length, 1);
    const books = (await c.get("/products?category=books")).body.data;
    assert.equal(books.pagination.total, 4);
    assert.ok(books.products.every((p) => p.category.slug === "books"));
    const priced = (await c.get("/products?minPrice=500&maxPrice=1000&limit=50")).body.data.products;
    assert.ok(priced.length > 0 && priced.every((p) => p.price >= 500 && p.price <= 1000));
    const rated = (await c.get("/products?minRating=4&limit=50")).body.data.products;
    assert.ok(rated.every((p) => p.rating >= 4));
    const inStock = (await c.get("/products?inStock=true&limit=50")).body.data.products;
    assert.ok(inStock.every((p) => p.stock > 0));
  });

  test("sorting", async () => {
    const c = client();
    const asc = (await c.get("/products?sort=price_asc&limit=50")).body.data.products.map((p) => p.price);
    assert.deepEqual(asc, [...asc].sort((a, b) => a - b));
    const desc = (await c.get("/products?sort=price_desc&limit=50")).body.data.products.map((p) => p.price);
    assert.deepEqual(desc, [...desc].sort((a, b) => b - a));
    assert.equal((await c.get("/products?sort=popular")).status, 200);
  });

  test("blank query values are ignored, bad values are rejected", async () => {
    const c = client();
    assert.equal((await c.get("/products?search=&category=&minPrice=&page=&sort=")).status, 200);
    assert.equal((await c.get("/products?sort=cheapest")).status, 400);
    assert.equal((await c.get("/products?limit=500")).status, 400);
    assert.equal((await c.get("/products?page=0")).status, 400);
  });

  test("SQL injection text is treated as plain text", async () => {
    const res = await client().get(`/products?search=${encodeURIComponent("' OR 1=1; DROP TABLE products; --")}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.products.length, 0);
    assert.equal((await client().get("/products")).body.data.pagination.total, 20);
  });

  test("detail, related, featured, and not-found cases", async () => {
    const c = client();
    const first = (await c.get("/products?limit=1")).body.data.products[0];
    const detail = await c.get(`/products/${first.id}`);
    assert.equal(detail.body.data.id, first.id);
    const related = (await c.get(`/products/${first.id}/related`)).body.data;
    assert.ok(related.length <= 4 && related.every((p) => p.id !== first.id && p.category.id === first.category.id));
    const featured = (await c.get("/products/featured")).body.data;
    assert.ok(featured.length > 0 && featured.every((p) => p.isFeatured));
    assert.equal((await c.get("/products/99999")).status, 404);
    assert.equal((await c.get("/products/abc")).status, 400);
  });
});

describe("wishlist", () => {
  test("requires login", async () => {
    assert.equal((await client().get("/wishlist")).status, 401);
  });

  test("add (idempotent), flag on product, list, remove", async () => {
    const c = await newUser();
    const product = await findProduct(c, "Atomic Habits");
    assert.equal(product.isWishlisted, false);
    assert.equal((await c.put(`/wishlist/${product.id}`)).status, 200);
    assert.equal((await c.put(`/wishlist/${product.id}`)).status, 200); // second call changes nothing
    assert.equal((await c.get(`/products/${product.id}`)).body.data.isWishlisted, true);
    assert.equal((await c.get("/wishlist")).body.data.length, 1);
    assert.equal((await c.del(`/wishlist/${product.id}`)).body.data.wishlisted, false);
    assert.equal((await c.get("/wishlist")).body.data.length, 0);
    assert.equal((await c.put("/wishlist/99999")).status, 404);
  });
});

describe("reviews", () => {
  test("create, duplicate, aggregate update, delete", async () => {
    const c = await newUser();
    const product = await findProduct(c, "Deep Work");
    assert.equal((await client().post(`/products/${product.id}/reviews`, { rating: 5, comment: "Great" })).status, 401);
    assert.equal((await c.post(`/products/${product.id}/reviews`, { rating: 9, comment: "Great" })).status, 400);

    const created = await c.post(`/products/${product.id}/reviews`, { rating: 1, comment: "Not for me" });
    assert.equal(created.status, 201);
    assert.equal((await c.post(`/products/${product.id}/reviews`, { rating: 5, comment: "Again" })).status, 409);

    const list = (await c.get(`/products/${product.id}/reviews`)).body.data;
    assert.equal(list.summary.count, product.reviewCount + 1);
    assert.ok(list.reviews.some((r) => r.isMine && r.rating === 1));
    assert.deepEqual(Object.keys(list.summary.distribution), ["1", "2", "3", "4", "5"]);
    const after = await c.get(`/products/${product.id}`);
    assert.equal(after.body.data.reviewCount, product.reviewCount + 1);

    const other = await newUser();
    assert.equal((await other.del(`/reviews/${created.body.data.id}`)).status, 403);
    assert.equal((await c.del(`/reviews/${created.body.data.id}`)).status, 200);
    assert.equal((await c.get(`/products/${product.id}`)).body.data.reviewCount, product.reviewCount);
  });
});

describe("orders", () => {
  test("requires login and validates input", async () => {
    assert.equal((await client().post("/orders", {})).status, 401);
    const c = await newUser();
    const res = await c.post("/orders", {
      items: [],
      shipping: { ...shipping, phone: "123", pincode: "12" },
      paymentMethod: "bitcoin",
    });
    assert.equal(res.status, 400);
    const fields = res.body.errors.map((e) => e.field);
    assert.ok(fields.includes("items") && fields.includes("shipping.phone") && fields.includes("shipping.pincode") && fields.includes("paymentMethod"));
  });

  test("the server uses database prices and charges shipping correctly", async () => {
    const c = await newUser();
    const cheap = await findProduct(c, "Atomic Habits"); // under the free-shipping limit
    const res = await c.post("/orders", {
      items: [{ productId: cheap.id, quantity: 1, price: 1 }], // a fake client price is ignored
      shipping,
      paymentMethod: "cod",
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.subtotal, cheap.price);
    assert.equal(res.body.data.shippingFee, 49);
    assert.equal(res.body.data.total, cheap.price + 49);
    assert.equal(res.body.data.status, "pending"); // cash on delivery

    const pricey = await findProduct(c, "Aurora");
    const free = await c.post("/orders", { items: [{ productId: pricey.id, quantity: 1 }], shipping, paymentMethod: "upi" });
    assert.equal(free.body.data.shippingFee, 0);
    assert.equal(free.body.data.status, "paid");
  });

  test("stock is reduced, duplicates are merged, and cancelling restores stock", async () => {
    const c = await newUser();
    const product = await findProduct(c, "Memory Foam Pillow");
    const res = await c.post("/orders", {
      items: [{ productId: product.id, quantity: 1 }, { productId: product.id, quantity: 2 }],
      shipping,
      paymentMethod: "card",
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.items.length, 1);
    assert.equal(res.body.data.items[0].quantity, 3);
    assert.equal((await c.get(`/products/${product.id}`)).body.data.stock, product.stock - 3);

    const cancelled = await c.patch(`/orders/${res.body.data.id}/cancel`);
    assert.equal(cancelled.body.data.status, "cancelled");
    assert.equal((await c.get(`/products/${product.id}`)).body.data.stock, product.stock);
    assert.equal((await c.patch(`/orders/${res.body.data.id}/cancel`)).status, 409);
  });

  test("insufficient stock fails the WHOLE order and rolls everything back", async () => {
    const c = await newUser();
    const plenty = await findProduct(c, "Canvas Backpack");
    const scarce = await findProduct(c, "Resistance Bands"); // only 3 in stock
    const res = await c.post("/orders", {
      items: [{ productId: plenty.id, quantity: 2 }, { productId: scarce.id, quantity: 4 }],
      shipping,
      paymentMethod: "card",
    });
    assert.equal(res.status, 409);
    assert.equal(res.body.errors[0].available, scarce.stock);
    // The first line was reserved before the second failed. The rollback must undo it.
    assert.equal((await c.get(`/products/${plenty.id}`)).body.data.stock, plenty.stock);
    assert.equal((await c.get("/orders/my")).body.data.orders.length, 0);
  });

  test("my orders, order detail, and ownership checks", async () => {
    const c = await newUser();
    const product = await findProduct(c, "Yoga Mat");
    const placed = (await c.post("/orders", { items: [{ productId: product.id, quantity: 1 }], shipping, paymentMethod: "cod" })).body.data;

    const mine = (await c.get("/orders/my?limit=5")).body.data;
    assert.equal(mine.orders.length, 1);
    assert.equal(mine.orders[0].items[0].name, product.name);
    assert.equal((await c.get(`/orders/${placed.id}`)).body.data.id, placed.id);
    assert.equal((await c.get("/orders/my?status=delivered")).body.data.orders.length, 0);

    const stranger = await newUser();
    assert.equal((await stranger.get(`/orders/${placed.id}`)).status, 404); // looks like it does not exist
    assert.equal((await stranger.patch(`/orders/${placed.id}/cancel`)).status, 404);
  });
});

describe("admin", () => {
  test("customers and visitors cannot reach admin routes", async () => {
    assert.equal((await client().get("/admin/stats")).status, 401);
    const user = await loginAs(DEMO_USER);
    assert.equal((await user.get("/admin/stats")).status, 403);
    assert.equal((await user.get("/admin/orders")).status, 403);
    assert.equal((await user.post("/products", {})).status, 403);
  });

  test("stats have the shape the dashboard needs", async () => {
    const admin = await loginAs(DEMO_ADMIN);
    const { totals, salesByDay, topProducts, lowStock, ordersByStatus } = (await admin.get("/admin/stats")).body.data;
    assert.ok(totals.revenue > 0 && totals.orders > 0 && totals.products === 20 && totals.customers >= 5);
    assert.equal(salesByDay.length, 14);
    assert.ok(salesByDay.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date)));
    assert.ok(topProducts.length > 0 && topProducts.length <= 5);
    assert.ok(lowStock.length > 0 && lowStock.every((p) => p.stock <= 5));
    assert.deepEqual(Object.keys(ordersByStatus).sort(), ["cancelled", "delivered", "paid", "pending", "shipped"]);
  });

  test("order list with filters, and the status workflow", async () => {
    const admin = await loginAs(DEMO_ADMIN);
    const list = (await admin.get("/admin/orders?limit=5")).body.data;
    assert.equal(list.orders.length, 5);
    assert.ok(list.orders[0].customer.email);
    assert.ok((await admin.get("/admin/orders?status=delivered&limit=50")).body.data.orders.every((o) => o.status === "delivered"));

    const c = await newUser();
    const product = await findProduct(c, "Insulated Steel Bottle");
    const order = (await c.post("/orders", { items: [{ productId: product.id, quantity: 2 }], shipping, paymentMethod: "upi" })).body.data;
    assert.equal(order.status, "paid");

    const bad = await admin.patch(`/admin/orders/${order.id}/status`, { status: "delivered" });
    assert.equal(bad.status, 409); // cannot skip "shipped"
    assert.equal((await admin.patch(`/admin/orders/${order.id}/status`, { status: "shipped" })).body.data.status, "shipped");
    assert.equal((await admin.patch(`/admin/orders/${order.id}/status`, { status: "cancelled" })).status, 409);
    assert.equal((await admin.patch(`/admin/orders/${order.id}/status`, { status: "delivered" })).body.data.status, "delivered");
    assert.equal((await admin.patch(`/admin/orders/${order.id}/status`, { status: "flying" })).status, 400);
    assert.equal((await admin.get(`/admin/orders?search=${order.id}`)).body.data.orders[0].id, order.id);
  });

  test("admin cancelling an order restores stock", async () => {
    const admin = await loginAs(DEMO_ADMIN);
    const c = await newUser();
    const product = await findProduct(c, "Ceramic Table Lamp");
    const order = (await c.post("/orders", { items: [{ productId: product.id, quantity: 2 }], shipping, paymentMethod: "cod" })).body.data;
    assert.equal((await c.get(`/products/${product.id}`)).body.data.stock, product.stock - 2);
    await admin.patch(`/admin/orders/${order.id}/status`, { status: "cancelled" });
    assert.equal((await c.get(`/products/${product.id}`)).body.data.stock, product.stock);
  });

  test("product create, validate, update, archive", async () => {
    const admin = await loginAs(DEMO_ADMIN);
    const electronics = (await admin.get("/categories")).body.data.find((c) => c.slug === "electronics");
    const body = { name: "Test Gadget Pro", price: 1500, originalPrice: 2000, stock: 10, categoryId: electronics.id, image: "https://picsum.photos/seed/gadget/600/600" };

    const bad = await admin.post("/products", { ...body, originalPrice: 1000, image: "not-a-url", stock: -1 });
    assert.equal(bad.status, 400);
    assert.ok(bad.body.errors.map((e) => e.field).includes("image"));
    assert.equal((await admin.post("/products", { ...body, originalPrice: 1000 })).status, 400);
    assert.equal((await admin.post("/products", { ...body, categoryId: 9999 })).status, 400);

    const created = await admin.post("/products", body);
    assert.equal(created.status, 201);
    assert.equal(created.body.data.slug, "test-gadget-pro");
    assert.equal(created.body.data.discountPercent, 25);
    const id = created.body.data.id;
    assert.equal((await admin.post("/products", body)).body.data.slug, "test-gadget-pro-2"); // slug stays unique

    const updated = await admin.patch(`/products/${id}`, { price: 1200, stock: 4 });
    assert.equal(updated.body.data.price, 1200);
    assert.equal(updated.body.data.stock, 4);
    assert.equal(updated.body.data.name, "Test Gadget Pro"); // untouched fields stay the same
    assert.equal((await admin.patch(`/products/${id}`, {})).status, 400);

    assert.equal((await admin.del(`/products/${id}`)).status, 200);
    assert.equal((await client().get(`/products/${id}`)).status, 404); // hidden from shoppers
    assert.equal((await admin.get(`/products/${id}`)).status, 200); // still visible to admin
    const listed = await admin.get("/products?includeInactive=true&limit=50");
    assert.ok(listed.body.data.products.some((p) => p.id === id && p.isActive === false));
    assert.equal((await admin.del(`/products/${id}`)).status, 404);
    assert.equal((await admin.patch(`/products/${id}`, { isActive: true })).body.data.isActive, true); // restore
  });
});
