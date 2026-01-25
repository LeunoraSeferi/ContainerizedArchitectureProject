import express from "express";
import { orders } from "../data/db.js";

const router = express.Router();

// GET /api/v1/search/orders?status=&dateFrom=&dateTo=&customerId=&minTotal=&maxTotal=&page=&pageSize=&sort=
router.get("/search/orders", (req, res) => {
  const {
    status,
    dateFrom,
    dateTo,
    customerId,
    minTotal,
    maxTotal,
    page = "1",
    pageSize = "10",
    sort = "createdAt_desc",
  } = req.query;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const size = Math.max(parseInt(pageSize, 10) || 10, 1);

  let filtered = [...orders];

  // Filters
  if (status) filtered = filtered.filter(o => o.status === status);
  if (customerId) filtered = filtered.filter(o => o.customerId === Number(customerId));

  if (minTotal) filtered = filtered.filter(o => o.total >= Number(minTotal));
  if (maxTotal) filtered = filtered.filter(o => o.total <= Number(maxTotal));

  if (dateFrom) filtered = filtered.filter(o => new Date(o.createdAt) >= new Date(dateFrom));
  if (dateTo) filtered = filtered.filter(o => new Date(o.createdAt) <= new Date(dateTo));

  // Sorting
  const sorters = {
    createdAt_desc: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    createdAt_asc: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    total_desc: (a, b) => (b.total ?? 0) - (a.total ?? 0),
    total_asc: (a, b) => (a.total ?? 0) - (b.total ?? 0),
  };

  const sorter = sorters[sort] || sorters.createdAt_desc;
  filtered.sort(sorter);

  // Pagination
  const total = filtered.length;
  const start = (pageNum - 1) * size;
  const results = filtered.slice(start, start + size);

  res.json({
    query: { status, dateFrom, dateTo, customerId, minTotal, maxTotal, page: pageNum, pageSize: size, sort },
    paging: {
      page: pageNum,
      pageSize: size,
      total,
      totalPages: Math.ceil(total / size),
    },
    results,
    _links: {
      self: { href: `/api/v1/search/orders?page=${pageNum}&pageSize=${size}&sort=${sort}` },
      next: { href: `/api/v1/search/orders?page=${pageNum + 1}&pageSize=${size}&sort=${sort}` },
      prev: { href: `/api/v1/search/orders?page=${Math.max(pageNum - 1, 1)}&pageSize=${size}&sort=${sort}` },
    },
  });
});

export default router;
