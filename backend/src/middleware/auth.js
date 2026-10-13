import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { ApiError } from "../utils/ApiError.js";

// Reads the JWT from the httpOnly cookie, then loads the user fresh from the database.
// Loading from the database means a changed role or a deleted account takes effect at once.
export function createAuthMiddleware(db) {
  const findUser = db.prepare("SELECT id, name, email, role, created_at FROM users WHERE id = ?");

  const readUser = (req) => {
    const token = req.cookies?.token;
    if (!token) return null;
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      return findUser.get(Number(payload.sub)) ?? null;
    } catch {
      return null; // expired, tampered or malformed token
    }
  };

  // Attaches req.user when logged in, but lets anonymous visitors through
  const optionalAuth = (req, _res, next) => {
    req.user = readUser(req);
    next();
  };

  const requireAuth = (req, _res, next) => {
    const user = readUser(req);
    if (!user) return next(new ApiError(401, "Please sign in to continue."));
    req.user = user;
    next();
  };

  const requireAdmin = (req, res, next) =>
    requireAuth(req, res, (err) => {
      if (err) return next(err);
      if (req.user.role !== "admin") return next(new ApiError(403, "Administrator access is required."));
      next();
    });

  return { optionalAuth, requireAuth, requireAdmin };
}

export const signToken = (user) =>
  jwt.sign({ sub: String(user.id), role: user.role }, config.jwtSecret, { expiresIn: "7d" });

export const cookieOptions = {
  httpOnly: true, // JavaScript cannot read it, which blocks token theft through XSS
  secure: config.isProd, // HTTPS only in production
  sameSite: config.isProd ? "none" : "lax", // "none" is needed when the frontend is on another domain
  path: "/",
};
