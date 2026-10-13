import { config } from "./config.js";
import { createDb } from "./db.js";
import { createApp } from "./app.js";
import { seedDatabase } from "./seed.js";

const db = createDb();

// First run: fill the empty database with demo data so the frontend has something to show
if (db.prepare("SELECT COUNT(*) AS n FROM products").get().n === 0) {
  seedDatabase(db);
  console.log("Database was empty, so demo data was added.");
}

const server = createApp(db).listen(config.port, () => {
  console.log(`ShopSphere API running on http://localhost:${config.port}/api`);
});

// Close cleanly on Ctrl+C
const shutdown = () => {
  server.close(() => {
    db.close();
    process.exit(0);
  });
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
