import express from "express";
import { z } from "zod";
import { query } from "../db/db.js";
import { productLinks } from "../utils/hateoas.js";
import { requireAuth, requireRole } from "../middlewares/authJwt.js";

const router = express.Router();

// CREATE schema (admin create)
const productSchema = z.object({
  name: z.string().min(2),
  price: z.number().positive(),
  categoryId: z.number().int().positive(),
  brand: z.string().min(1),
  inStock: z.boolean(),
  // description field
  description: z.string().optional().default(""),
});

// UPDATE schema (admin update - partial)
const productUpdateSchema = z
  .object({
    name: z.string().min(2).optional(),
    price: z.number().positive().optional(),
    categoryId: z.number().int().positive().optional(),
    brand: z.string().min(1).optional(),
    inStock: z.boolean().optional(),
    // description field
    description: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields provided",
  });

// =====================
// GET all (public)
// =====================
router.get("/products", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT 
         id, 
         name, 
         price::float AS price, 
         category_id AS "categoryId", 
         brand, 
         in_stock AS "inStock",
         COALESCE(description, '') AS description
       FROM products
       ORDER BY id ASC`
    );

    const withLinks = result.rows.map((p) => ({
      ...p,
      _links: productLinks(p.id, p.categoryId),
    }));

    res.json(withLinks);
  } catch (e) {
    next({ status: 500, code: "DB_ERROR", message: "Failed to fetch products" });
  }
});

// =====================
// GET by id (public)
// =====================
router.get("/products/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const result = await query(
      `SELECT 
         id, 
         name, 
         price::float AS price, 
         category_id AS "categoryId", 
         brand, 
         in_stock AS "inStock",
         COALESCE(description, '') AS description
       FROM products
       WHERE id=$1`,
      [id]
    );

    const p = result.rows[0];
    if (!p) return next({ status: 404, code: "NOT_FOUND", message: "Product not found" });

    res.json({ ...p, _links: productLinks(p.id, p.categoryId) });
  } catch (e) {
    next({ status: 500, code: "DB_ERROR", message: "Failed to fetch product" });
  }
});

// =====================
// POST create (ADMIN only)
// =====================
router.post("/products", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const body = productSchema.parse(req.body);

    // validate category exists
    const cat = await query(`SELECT id FROM categories WHERE id=$1`, [body.categoryId]);
    if (cat.rowCount === 0) {
      return next({ status: 400, code: "VALIDATION_ERROR", message: "Invalid categoryId" });
    }

    const insert = await query(
      `INSERT INTO products (name, price, category_id, brand, in_stock, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING 
         id, 
         name, 
         price::float AS price, 
         category_id AS "categoryId", 
         brand, 
         in_stock AS "inStock",
         COALESCE(description, '') AS description`,
      [body.name, body.price, body.categoryId, body.brand, body.inStock, body.description || ""]
    );

    const newProduct = insert.rows[0];
    res.status(201).json({
      ...newProduct,
      _links: productLinks(newProduct.id, newProduct.categoryId),
    });
  } catch (e) {
    next({
      status: 400,
      code: "VALIDATION_ERROR",
      message: e?.errors?.[0]?.message || "Invalid input",
    });
  }
});

// =====================
// PUT update (ADMIN only)
// =====================
router.put("/products/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    // Check product exists
    const existing = await query(`SELECT id FROM products WHERE id=$1`, [id]);
    if (existing.rowCount === 0) {
      return next({ status: 404, code: "NOT_FOUND", message: "Product not found" });
    }

    const body = productUpdateSchema.parse(req.body);

    // Validate category if provided
    if (body.categoryId !== undefined) {
      const cat = await query(`SELECT id FROM categories WHERE id=$1`, [body.categoryId]);
      if (cat.rowCount === 0) {
        return next({ status: 400, code: "VALIDATION_ERROR", message: "Invalid categoryId" });
      }
    }

    // Build dynamic update
    const fields = [];
    const values = [];
    let idx = 1;

    if (body.name !== undefined) {
      fields.push(`name=$${idx++}`);
      values.push(body.name);
    }
    if (body.price !== undefined) {
      fields.push(`price=$${idx++}`);
      values.push(body.price);
    }
    if (body.categoryId !== undefined) {
      fields.push(`category_id=$${idx++}`);
      values.push(body.categoryId);
    }
    if (body.brand !== undefined) {
      fields.push(`brand=$${idx++}`);
      values.push(body.brand);
    }
    if (body.inStock !== undefined) {
      fields.push(`in_stock=$${idx++}`);
      values.push(body.inStock);
    }
    if (body.description !== undefined) {
      fields.push(`description=$${idx++}`);
      values.push(body.description);
    }

    if (fields.length === 0) {
      return next({ status: 400, code: "VALIDATION_ERROR", message: "No fields provided" });
    }

    values.push(id);

    const updated = await query(
      `UPDATE products
       SET ${fields.join(", ")}
       WHERE id=$${idx}
       RETURNING 
         id, 
         name, 
         price::float AS price, 
         category_id AS "categoryId", 
         brand, 
         in_stock AS "inStock",
         COALESCE(description, '') AS description`,
      values
    );

    const p = updated.rows[0];
    res.json({ ...p, _links: productLinks(p.id, p.categoryId) });
  } catch (e) {
    next({
      status: 400,
      code: "VALIDATION_ERROR",
      message: e?.errors?.[0]?.message || "Invalid input",
    });
  }
});

// =====================
// DELETE remove (ADMIN only)
// =====================
router.delete("/products/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const del = await query(`DELETE FROM products WHERE id=$1 RETURNING id`, [id]);
    if (del.rowCount === 0) return next({ status: 404, code: "NOT_FOUND", message: "Product not found" });

    res.status(204).send();
  } catch (e) {
    next({ status: 500, code: "DB_ERROR", message: "Failed to delete product" });
  }
});

export default router;
