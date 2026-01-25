import express from "express";
import { query } from "../db/db.js";
import { requireAuth, requireRole } from "../middlewares/authJwt.js";

const router = express.Router();

// Admin only: list users
router.get("/users", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, email, role, created_at AS "createdAt"
       FROM users
       ORDER BY id ASC`
    );
    res.json(result.rows);
  } catch {
    next({ status: 500, code: "DB_ERROR", message: "Failed to fetch users" });
  }
});

router.get("/users/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await query(
      `SELECT id, name, email, role, created_at AS "createdAt"
       FROM users WHERE id=$1`,
      [id]
    );
    const user = result.rows[0];
    if (!user) return next({ status: 404, code: "NOT_FOUND", message: "User not found" });
    res.json(user);
  } catch {
    next({ status: 500, code: "DB_ERROR", message: "Failed to fetch user" });
  }
});

router.put("/users/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, role } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { fields.push(`name=$${idx++}`); values.push(name); }
    if (role !== undefined) { fields.push(`role=$${idx++}`); values.push(role); }

    if (fields.length === 0) {
      return next({ status: 400, code: "VALIDATION_ERROR", message: "No fields provided" });
    }

    values.push(id);

    const upd = await query(
      `UPDATE users SET ${fields.join(", ")} WHERE id=$${idx}
       RETURNING id, name, email, role, created_at AS "createdAt"`,
      values
    );

    if (upd.rowCount === 0) return next({ status: 404, code: "NOT_FOUND", message: "User not found" });

    res.json(upd.rows[0]);
  } catch {
    next({ status: 400, code: "VALIDATION_ERROR", message: "Invalid input" });
  }
});

router.delete("/users/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const del = await query(`DELETE FROM users WHERE id=$1 RETURNING id`, [id]);
    if (del.rowCount === 0) return next({ status: 404, code: "NOT_FOUND", message: "User not found" });
    res.status(204).send();
  } catch {
    next({ status: 500, code: "DB_ERROR", message: "Failed to delete user" });
  }
});

export default router;
