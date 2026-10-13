import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import { createAuthMiddleware } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { categoriesRouter } from "./routes/categories.js";
import { productsRouter } from "./routes/products.js";
import { reviewsRouter } from "./routes/reviews.js";
import { wishlistRouter } from "./routes/wishlist.js";
import { ordersRouter } from "./routes/orders.js";
import { adminRouter } from "./routes/admin.js";

// The database is passed in (dependency injection), so tests can use an in-memory one
export function createApp(db) {
  const app = express();
  const auth = createAuthMiddleware(db);

  app.set("trust proxy", 1); // correct client IPs for rate limiting behind a host like Render
  app.use(helmet()); // sets safe HTTP headers
  app.use(cors({ origin: config.clientUrl, credentials: true })); // credentials: true lets the cookie travel
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  if (!config.isTest) app.use(morgan("dev"));

  app.get("/api/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));

  app.use("/api/auth", authRouter(db, auth));
  app.use("/api/categories", categoriesRouter(db));
  app.use("/api/products", productsRouter(db, auth));
  app.use("/api", reviewsRouter(db, auth));
  app.use("/api/wishlist", wishlistRouter(db, auth));
  app.use("/api/orders", ordersRouter(db, auth));
  app.use("/api/admin", adminRouter(db, auth));

  app.use(notFound);
  app.use(errorHandler); // must be last

  return app;
}
