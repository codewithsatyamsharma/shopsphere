import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // The browser only talks to localhost:5173. Vite forwards /api to the backend,
    // so there is no CORS problem and the login cookie stays same-origin.
    proxy: {
      "/api": { target: process.env.API_TARGET || "http://127.0.0.1:4000", changeOrigin: true },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
    css: false,
  },
});
