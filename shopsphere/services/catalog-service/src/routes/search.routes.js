import express from "express";
import axios from "axios";

const router = express.Router();

// GET /api/v1/search/products?q=&category=&minPrice=&maxPrice=&brand=&inStock=&sort=&page=
router.get("/search/products", async (req, res, next) => {
  try {
    const {
      q = "*:*",
      category,
      brand,
      inStock,
      minPrice,
      maxPrice,
      sort = "score desc",
      page = "1",
    } = req.query;

    const pageSize = 10;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const start = (pageNum - 1) * pageSize;

    // Build Solr query
    // If q is empty -> *:*
    const qValue = String(q).trim() === "" ? "*:*" : String(q).trim();

    const fq = [];
    if (category) fq.push(`categoryId:${category}`);
    if (brand) fq.push(`brand:"${brand}"`);
    if (inStock === "true" || inStock === "false") {
  fq.push(`inStock:${inStock}`);
}


    // price range
    if (minPrice || maxPrice) {
      const min = minPrice ? minPrice : "*";
      const max = maxPrice ? maxPrice : "*";
      fq.push(`price:[${min} TO ${max}]`);
    }

    const solrUrl = process.env.SOLR_URL; // http://localhost:8983/solr/products
    const url = `${solrUrl}/select`;

    const solrParams = {
      q: qValue,
      wt: "json",
      rows: pageSize,
      start,
      sort,
    };

    // fq can be repeated -> pass array
    if (fq.length) solrParams.fq = fq;

    const response = await axios.get(url, { params: solrParams });

    const docs = response.data?.response?.docs || [];
    const numFound = response.data?.response?.numFound || 0;

    res.json({
      query: { q: qValue, category, brand, inStock, minPrice, maxPrice, sort, page: pageNum },
      paging: {
        page: pageNum,
        pageSize,
        total: numFound,
        totalPages: Math.ceil(numFound / pageSize),
      },
      results: docs,
    });
  } catch (err) {
    next({ status: 500, code: "SOLR_ERROR", message: "Solr query failed" });
  }
});

export default router;
