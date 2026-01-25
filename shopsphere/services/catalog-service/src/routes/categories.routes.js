import express from "express";
import { z } from "zod";
import { query } from "../db/db.js";
import { requireAuth, requireRole } from "../middlewares/authJwt.js";

const router = express.Router();

const categorySchema = z.object({
  name: z.string().min(2),
});

//  GET all (public)
router.get("/categories", async (req, res, next) => {
  try {
    const result = await query(`SELECT id, name FROM categories ORDER BY id ASC`);
    res.json(result.rows);
  } catch (e) {
    next({ status: 500, code: "DB_ERROR", message: "Failed to fetch categories" });
  }
});

//  GET by id (public)
router.get("/categories/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await query(`SELECT id, name FROM categories WHERE id=$1`, [id]);
    const cat = result.rows[0];
    if (!cat) return next({ status: 404, code: "NOT_FOUND", message: "Category not found" });
    res.json(cat);
  } catch (e) {
    next({ status: 500, code: "DB_ERROR", message: "Failed to fetch category" });
  }
});

// POST create (ADMIN only)
router.post("/categories", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const body = categorySchema.parse(req.body);

    const insert = await query(
      `INSERT INTO categories (name)
       VALUES ($1)
       RETURNING id, name`,
      [body.name]
    );

    res.status(201).json(insert.rows[0]);
  } catch (e) {
    // unique constraint / validation
    next({
      status: 400,
      code: "VALIDATION_ERROR",
      message: e?.errors?.[0]?.message || "Invalid input or category already exists",
    });
  }
});

// PUT update (ADMIN only)
router.put("/categories/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const body = categorySchema.parse(req.body);

    const upd = await query(
      `UPDATE categories
       SET name=$1
       WHERE id=$2
       RETURNING id, name`,
      [body.name, id]
    );

    if (upd.rowCount === 0) return next({ status: 404, code: "NOT_FOUND", message: "Category not found" });

    res.json(upd.rows[0]);
  } catch (e) {
    next({ status: 400, code: "VALIDATION_ERROR", message: "Invalid input" });
  }
});

//  DELETE remove (ADMIN only)
router.delete("/categories/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const del = await query(`DELETE FROM categories WHERE id=$1 RETURNING id`, [id]);
    if (del.rowCount === 0) return next({ status: 404, code: "NOT_FOUND", message: "Category not found" });

    res.status(204).send();
  } catch (e) {
    // If category used by products, FK stops delete
    next({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Category is in use by products",
    });
  }
});

export default router;
