import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { query } from "../db/db.js";

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "customer"]).optional(),
});

router.post("/auth/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);

    const hash = await bcrypt.hash(body.password, 10);

    const result = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1,$2,$3,$4)
       RETURNING id, name, email, role`,
      [body.name, body.email, hash, body.role || "customer"]
    );

    res.status(201).json(result.rows[0]);
  } catch (e) {
    next({ status: 400, code: "VALIDATION_ERROR", message: e.message });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/auth/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);

    const result = await query("SELECT * FROM users WHERE email=$1", [
      body.email,
    ]);

    if (!result.rows.length) {
      return next({
        status: 401,
        code: "UNAUTHORIZED",
        message: "Invalid credentials",
      });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(body.password, user.password_hash);

    if (!ok) {
      return next({
        status: 401,
        code: "UNAUTHORIZED",
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (e) {
    next({ status: 400, code: "VALIDATION_ERROR", message: e.message });
  }
});

export default router;
