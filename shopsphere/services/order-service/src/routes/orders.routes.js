import express from "express";
import { z } from "zod";
import { query } from "../db/db.js";
import { requireAuth, requireRole } from "../middlewares/authJwt.js";

const router = express.Router();

const createOrderSchema = z.object({
  customerId: z.number().int().positive(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        qty: z.number().int().positive(),
        unitPrice: z.number().positive(),
      })
    )
    .min(1),
  status: z.enum(["PENDING", "PAID", "SHIPPED", "CANCELLED"]).optional(),
});

const allowedStatus = ["PENDING", "PAID", "SHIPPED", "CANCELLED"];

function calcTotal(items) {
  return items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0);
}

//  GET all orders
router.get("/orders", async (req, res, next) => {
  try {
    const ordersRes = await query(
      `SELECT 
         id,
         customer_id AS "customerId",
         status,
         total::float AS total,
         created_at AS "createdAt"
       FROM orders
       ORDER BY id ASC`
    );

    const ids = ordersRes.rows.map((o) => o.id);
    let itemsByOrder = {};

    if (ids.length > 0) {
      const itemsRes = await query(
        `SELECT 
           order_id AS "orderId",
           product_id AS "productId",
           qty,
           unit_price::float AS "unitPrice"
         FROM order_items
         WHERE order_id = ANY($1::int[])
         ORDER BY order_id ASC, id ASC`,
        [ids]
      );

      for (const it of itemsRes.rows) {
        if (!itemsByOrder[it.orderId]) itemsByOrder[it.orderId] = [];
        itemsByOrder[it.orderId].push({
          productId: it.productId,
          qty: it.qty,
          unitPrice: it.unitPrice,
        });
      }
    }

    res.json(
      ordersRes.rows.map((o) => ({
        ...o,
        items: itemsByOrder[o.id] || [],
      }))
    );
  } catch (e) {
    next({ status: 500, code: "DB_ERROR", message: "Failed to fetch orders" });
  }
});

//  GET order by id
router.get("/orders/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const orderRes = await query(
      `SELECT 
         id,
         customer_id AS "customerId",
         status,
         total::float AS total,
         created_at AS "createdAt"
       FROM orders
       WHERE id=$1`,
      [id]
    );

    const o = orderRes.rows[0];
    if (!o) return next({ status: 404, code: "NOT_FOUND", message: "Order not found" });

    const itemsRes = await query(
      `SELECT 
         product_id AS "productId",
         qty,
         unit_price::float AS "unitPrice"
       FROM order_items
       WHERE order_id=$1
       ORDER BY id ASC`,
      [id]
    );

    res.json({ ...o, items: itemsRes.rows });
  } catch (e) {
    next({ status: 500, code: "DB_ERROR", message: "Failed to fetch order" });
  }
});

//  POST create order (USER authenticated)
router.post("/orders", requireAuth, async (req, res, next) => {
  try {
    const body = createOrderSchema.parse(req.body);
    const status = body.status || "PENDING";
    const total = calcTotal(body.items);

    await query("BEGIN");

    const insertOrder = await query(
      `INSERT INTO orders (customer_id, status, total)
       VALUES ($1, $2, $3)
       RETURNING 
         id,
         customer_id AS "customerId",
         status,
         total::float AS total,
         created_at AS "createdAt"`,
      [body.customerId, status, total]
    );

    const newOrder = insertOrder.rows[0];

    for (const it of body.items) {
      await query(
        `INSERT INTO order_items (order_id, product_id, qty, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [newOrder.id, it.productId, it.qty, it.unitPrice]
      );
    }

    await query("COMMIT");

    res.status(201).json({ ...newOrder, items: body.items });
  } catch (e) {
    try { await query("ROLLBACK"); } catch {}
    next({
      status: 400,
      code: "VALIDATION_ERROR",
      message: e?.errors?.[0]?.message || "Invalid input",
    });
  }
});

// PUT update order (status/items)
router.put("/orders/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const existing = await query(`SELECT id FROM orders WHERE id=$1`, [id]);
    if (existing.rowCount === 0) return next({ status: 404, code: "NOT_FOUND", message: "Order not found" });

    const { status, items } = req.body;

    await query("BEGIN");

    if (status !== undefined) {
      if (!allowedStatus.includes(status)) {
        await query("ROLLBACK");
        return next({ status: 400, code: "VALIDATION_ERROR", message: "Invalid status" });
      }
      await query(`UPDATE orders SET status=$1 WHERE id=$2`, [status, id]);
    }

    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        await query("ROLLBACK");
        return next({ status: 400, code: "VALIDATION_ERROR", message: "Items must be a non-empty array" });
      }

      await query(`DELETE FROM order_items WHERE order_id=$1`, [id]);

      for (const it of items) {
        await query(
          `INSERT INTO order_items (order_id, product_id, qty, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [id, it.productId, it.qty, it.unitPrice]
        );
      }

      const newTotal = calcTotal(items);
      await query(`UPDATE orders SET total=$1 WHERE id=$2`, [newTotal, id]);
    }

    await query("COMMIT");

    const orderRes = await query(
      `SELECT id, customer_id AS "customerId", status, total::float AS total, created_at AS "createdAt"
       FROM orders WHERE id=$1`,
      [id]
    );
    const itemsRes = await query(
      `SELECT product_id AS "productId", qty, unit_price::float AS "unitPrice"
       FROM order_items WHERE order_id=$1 ORDER BY id ASC`,
      [id]
    );

    res.json({ ...orderRes.rows[0], items: itemsRes.rows });
  } catch (e) {
    try { await query("ROLLBACK"); } catch {}
    next({ status: 500, code: "DB_ERROR", message: "Failed to update order" });
  }
});

//  DELETE order (ADMIN)
router.delete("/orders/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    await query(`DELETE FROM order_items WHERE order_id=$1`, [id]);
    const del = await query(`DELETE FROM orders WHERE id=$1 RETURNING id`, [id]);

    if (del.rowCount === 0) return next({ status: 404, code: "NOT_FOUND", message: "Order not found" });

    res.status(204).send();
  } catch (e) {
    next({ status: 500, code: "DB_ERROR", message: "Failed to delete order" });
  }
});

export default router;
