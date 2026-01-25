import express from "express";
import { query } from "../db/db.js";
import { solrAddDocs } from "../solr/solrClient.js";

const router = express.Router();

// POST /api/v1/solr/reindex
// Reads products from Postgres and indexes them into Solr
router.post("/solr/reindex", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT 
        id,
        name,
        brand,
        price::float AS price,
        category_id AS "categoryId",
        in_stock AS "inStock"
       FROM products
       ORDER BY id ASC`
    );

    const docs = result.rows.map((p) => ({
      id: String(p.id), // Solr id should be string
      name: p.name,
      brand: p.brand,
      price: p.price,
      categoryId: p.categoryId,
      inStock: p.inStock,
    }));

    await solrAddDocs(docs);

    res.json({
      message: "Indexed products into Solr successfully",
      indexedCount: docs.length,
    });
  } catch (err) {
    next({
      status: 502,
      code: "SOLR_INDEX_ERROR",
      message: "Failed to index products into Solr",
      details: err?.message,
    });
  }
});

export default router;
