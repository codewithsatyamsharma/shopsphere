import "dotenv/config";

const env = process.env.NODE_ENV || "development";

export const config = {
  env,
  isProd: env === "production",
  isTest: env === "test",
  port: Number(process.env.PORT) || 4000, // 4000, not 5000: macOS uses 5000 for AirPlay
  jwtSecret: process.env.JWT_SECRET || "dev-only-secret-change-me",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  dbPath: process.env.DB_PATH || "./data/shopsphere.db",

  // Business rules live on the server, never in React
  freeShippingThreshold: 999, // order subtotal (INR) at or above this ships free
  shippingFee: 49,
  maxUnitsPerProduct: 10,
};

if (config.isProd && config.jwtSecret === "dev-only-secret-change-me") {
  throw new Error("Set a real JWT_SECRET before running in production.");
}
