import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { config } from "../config.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { mapUser } from "../utils/helpers.js";
import { validate } from "../middleware/validate.js";
import { signToken, cookieOptions } from "../middleware/auth.js";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name is too long"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be 72 characters or fewer") // bcrypt ignores everything after 72 bytes
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/\d/, "Password must contain a number"),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name is too long"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: registerSchema.shape.password,
});

// Compared against when the email does not exist, so response time does not reveal valid emails
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export function authRouter(db, { requireAuth }) {
  const router = Router();

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => config.isTest,
    message: { success: false, message: "Too many attempts. Please try again in a few minutes." },
  });

  const sendSession = (res, status, userRow, message) => {
    res.cookie("token", signToken(userRow), { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(status).json({ success: true, message, data: mapUser(userRow) });
  };

  router.post(
    "/register",
    limiter,
    validate(registerSchema),
    asyncHandler(async (req, res) => {
      const { name, email, password } = req.body;
      if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) {
        throw new ApiError(409, "An account with this email already exists.", [
          { field: "email", message: "An account with this email already exists." },
        ]);
      }
      const hash = await bcrypt.hash(password, 10);
      const info = db
        .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
        .run(name, email, hash);
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
      sendSession(res, 201, user, "Account created.");
    }),
  );

  router.post(
    "/login",
    limiter,
    validate(loginSchema),
    asyncHandler(async (req, res) => {
      const { email, password } = req.body;
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      const matches = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
      // Same message for "no such email" and "wrong password" on purpose
      if (!user || !matches) throw new ApiError(401, "Invalid email or password.");
      sendSession(res, 200, user, "Signed in.");
    }),
  );

  router.post("/logout", (_req, res) => {
    res.clearCookie("token", cookieOptions);
    res.json({ success: true, message: "Signed out." });
  });

  router.get("/me", requireAuth, (req, res) => {
    res.json({ success: true, data: mapUser(req.user) });
  });

  router.patch("/me", requireAuth, validate(profileSchema), (req, res) => {
    db.prepare("UPDATE users SET name = ? WHERE id = ?").run(req.body.name, req.user.id);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    res.json({ success: true, message: "Profile updated.", data: mapUser(user) });
  });

  router.patch(
    "/password",
    requireAuth,
    validate(passwordSchema),
    asyncHandler(async (req, res) => {
      const { currentPassword, newPassword } = req.body;
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
      if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
        throw new ApiError(400, "Current password is incorrect.", [
          { field: "currentPassword", message: "Current password is incorrect." },
        ]);
      }
      const hash = await bcrypt.hash(newPassword, 10);
      db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, user.id);
      res.json({ success: true, message: "Password changed." });
    }),
  );

  return router;
}
