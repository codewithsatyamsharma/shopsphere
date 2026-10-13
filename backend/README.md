# ShopSphere API

REST API for the ShopSphere practice project (mini e-commerce).
Node.js, Express 4, SQLite (better-sqlite3), JWT in an httpOnly cookie, zod validation.

SQLite needs **no database installation**. The database file is created automatically on the first run.

**Requires Node.js 22 or newer.** Check with `node -v`. If yours is older, install a newer one
(for example `nvm install 22 && nvm use 22`, or download it from nodejs.org).

## Run it

```bash
npm install
cp .env.example .env     # then edit JWT_SECRET
npm run dev              # http://localhost:4000/api
```

The first start fills the database with 20 products, 5 categories, 5 customers, reviews and 45 orders.

| Command | What it does |
|---|---|
| `npm run dev` | Start with auto-restart on file changes |
| `npm start` | Start normally (production) |
| `npm run seed` | Wipe the database and reload the demo data |
| `npm test` | Run 29 automated API tests (uses a throwaway in-memory database) |

**Demo logins**

| Role | Email | Password |
|---|---|---|
| Admin | admin@shopsphere.local | Admin@123 |
| Customer | demo@shopsphere.local | Demo@1234 |

## Response format

Every response has the same envelope.

```json
{ "success": true, "message": "optional", "data": { } }
{ "success": false, "message": "Why it failed", "errors": [{ "field": "email", "message": "..." }] }
```

`errors` appears on validation failures so a form can show each message under the right field.
Status codes: `200` ok, `201` created, `400` invalid input, `401` not signed in,
`403` not allowed, `404` not found, `409` conflict (duplicate, out of stock, invalid status change).

## Endpoints

"Auth" column: **-** public, **User** signed in, **Admin** admin only.

### Auth
| Method | Path | Auth | Body or notes |
|---|---|---|---|
| POST | `/auth/register` | - | `{ name, email, password }`. Sets the cookie. |
| POST | `/auth/login` | - | `{ email, password }`. Sets the cookie. |
| POST | `/auth/logout` | - | Clears the cookie |
| GET | `/auth/me` | User | The current user |
| PATCH | `/auth/me` | User | `{ name }` |
| PATCH | `/auth/password` | User | `{ currentPassword, newPassword }` |

### Catalog
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/categories` | - | With `productCount` |
| GET | `/products` | - | Query: `search, category (slug), minPrice, maxPrice, minRating, inStock, sort, page, limit` |
| GET | `/products/featured` | - | Up to 8 |
| GET | `/products/:id` | - | One product |
| GET | `/products/:id/related` | - | Up to 4 from the same category |
| POST | `/products` | Admin | Create |
| PATCH | `/products/:id` | Admin | Partial update (`isActive: true` restores an archived product) |
| DELETE | `/products/:id` | Admin | Soft delete (archives it) |

`sort` is one of `newest` (default), `price_asc`, `price_desc`, `rating`, `popular`. `limit` defaults to 12 and is at most 50.
Admins can add `includeInactive=true` to also see archived products.

### Reviews
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/products/:id/reviews` | - | `?page&limit`. Returns `reviews`, `summary` (average, count, distribution), `pagination` |
| POST | `/products/:id/reviews` | User | `{ rating 1-5, comment }`. One review per user per product. |
| DELETE | `/reviews/:id` | User | Your own review (admins can delete any) |

### Wishlist
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/wishlist` | User | Wishlisted products |
| PUT | `/wishlist/:productId` | User | Add. Safe to repeat. |
| DELETE | `/wishlist/:productId` | User | Remove |

### Orders
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/orders` | User | `{ items: [{ productId, quantity }], shipping: { name, phone, address, city, pincode }, paymentMethod: "cod" \| "card" \| "upi" }` |
| GET | `/orders/my` | User | `?status&page&limit` |
| GET | `/orders/:id` | User | Your own order (admins can open any) |
| PATCH | `/orders/:id/cancel` | User | Only `pending` or `paid` orders. Restores stock. |

Prices are **never** read from the request. The server uses the database price, checks stock,
adds shipping (free at 999 or more, otherwise 49) and does everything in one transaction.

### Admin
| Method | Path | Notes |
|---|---|---|
| GET | `/admin/stats` | Totals, 14-day sales, top products, low stock, orders by status |
| GET | `/admin/orders` | `?status&search&page&limit` (search by order id, customer name or email) |
| PATCH | `/admin/orders/:id/status` | `{ status }`. Allowed: pending to paid, shipped or cancelled. paid to shipped or cancelled. shipped to delivered. |

## Project structure

```
src/
  server.js            starts the server, seeds an empty database
  app.js               builds the Express app: security middleware, then routes
  config.js            environment variables and business rules
  db.js                schema and connection
  seed.js              demo data
  middleware/          auth (JWT cookie), validate (zod), errorHandler
  routes/              one file per resource
  services/orders.js   order creation and cancellation (transactions)
  utils/               ApiError, asyncHandler, helpers
tests/api.test.js      29 end-to-end API tests
```

## Concepts to be able to explain

- **Layers and dependency injection:** `createApp(db)` receives the database, so tests pass an in-memory one.
- **Authentication:** bcrypt-hashed passwords; a JWT stored in an httpOnly cookie, so JavaScript (and any XSS payload) cannot read it.
- **Authorization:** `requireAuth`, `requireAdmin`, and ownership checks (someone else's order returns 404, not 403).
- **Validation:** every request body, query and param goes through zod before any logic runs.
- **Transactions:** order creation reserves stock, inserts the order and its items, and rolls everything back if any line fails.
- **Never trust the client:** prices, totals and shipping are calculated on the server.
- **SQL safety:** parameterised queries only; sorting uses a fixed whitelist instead of user text.
- **N+1 problem:** order items for a whole page of orders are loaded with one query.
- **Soft delete:** archived products stay in the table so old orders still make sense.
- **Idempotency:** `PUT /wishlist/:id` can be repeated safely.
- **Rate limiting, Helmet, CORS with credentials.**

## Deploying

The frontend can go to Vercel or Netlify. For the API, set these environment variables:
`NODE_ENV=production`, `JWT_SECRET` (long random text), `CLIENT_URL` (your frontend's exact URL), and `DB_PATH`.

SQLite stores data in a file. Many free hosts wipe the disk on every deploy, so either attach a persistent disk
and point `DB_PATH` at it, or accept that the demo data is recreated from the seed on each start.
In production the cookie is `Secure` and `SameSite=None`, which requires HTTPS on both sites.
