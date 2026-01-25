// services/api-gateway/src/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import axios from "axios";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";

import { typeDefs } from "./graphql/schema/typeDefs.js";
import { resolvers } from "./graphql/resolvers/index.js";

// Redis connect
import { connectRedis } from "./redis/redisClient.js";
import { apiLimiter } from "./middlewares/rateLimit.js";
import { metricsMiddleware, metricsEndpoint } from "./monitoring/metrics.js";

// Cache middlewares
import { cacheGet } from "./middlewares/cache.js";
import { clearProductsCache } from "./middlewares/cacheInvalidate.js";

const app = express();
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Monitoring + Rate limiting
app.use(metricsMiddleware);
app.use(apiLimiter);

// Connect Redis when gateway starts
await connectRedis();

// ======================
// Base URLs
// ======================
// Inside Docker: use docker-compose service names (recommended)
// Locally: fall back to localhost
const CATALOG_URL =
  process.env.CATALOG_URL || "http://localhost:3004/api/v1"; // host port for catalog
const ORDERS_URL =
  process.env.ORDERS_URL || "http://localhost:3003/api/v1";
const AUTH_URL =
  process.env.AUTH_URL || "http://localhost:3001/api/v1";

// Forward Authorization header (Bearer token) to downstream services
function forwardAuth(req) {
  const auth = req.headers.authorization;
  return auth ? { Authorization: auth } : {};
}

/**
 * ======================================
 * REST PROXY ENDPOINTS
 * Gateway routes:
 *  Auth:        /api/v1/auth/login (POST)
 *  Products:    /api/v1/products (GET/POST) + /api/v1/products/:id (GET/PUT/DELETE)
 *  Categories:  /api/v1/categories (GET/POST) + /api/v1/categories/:id (PUT/DELETE)
 *  Search:      /api/v1/search/products (GET)
 *  Orders:      /api/v1/orders (GET admin, POST user) + /api/v1/orders/:id (PUT admin)
 * ======================================
 */

// ======================
// AUTH (Auth service)
// ======================
app.post("/api/v1/auth/login", async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_URL}/auth/login`, req.body);
    return res.json(response.data);
  } catch (err) {
    const status = err?.response?.status || 400;
    return res.status(status).json(
      err?.response?.data || {
        error: "AUTH_PROXY_ERROR",
        message: "Login failed via gateway",
      }
    );
  }
});

// ======================
// PRODUCTS (Catalog)
// ======================

// GET all products (CACHED)
app.get("/api/v1/products", cacheGet(60), async (req, res) => {
  try {
    const response = await axios.get(`${CATALOG_URL}/products`);
    return res.json(response.data);
  } catch (err) {
    return res.status(502).json({
      error: "CATALOG_PROXY_ERROR",
      message: "Failed to fetch products from catalog-service",
    });
  }
});

// GET product by id (CACHED)
app.get("/api/v1/products/:id", cacheGet(60), async (req, res) => {
  try {
    const response = await axios.get(`${CATALOG_URL}/products/${req.params.id}`);
    return res.json(response.data);
  } catch (err) {
    const status = err?.response?.status || 502;
    return res.status(status).json(
      err?.response?.data || {
        error: "CATALOG_PROXY_ERROR",
        message: "Failed to fetch product from catalog-service",
      }
    );
  }
});

// POST create product (ADMIN enforced by catalog-service)
app.post("/api/v1/products", async (req, res) => {
  try {
    const response = await axios.post(`${CATALOG_URL}/products`, req.body, {
      headers: { ...forwardAuth(req) },
    });

    await clearProductsCache(); // clear cache after write
    return res.status(201).json(response.data);
  } catch (err) {
    const status = err?.response?.status || 400;
    return res.status(status).json(
      err?.response?.data || {
        error: "CATALOG_PROXY_ERROR",
        message: "Create product failed",
      }
    );
  }
});

// PUT update product (ADMIN enforced by catalog-service)
app.put("/api/v1/products/:id", async (req, res) => {
  try {
    const response = await axios.put(
      `${CATALOG_URL}/products/${req.params.id}`,
      req.body,
      { headers: { ...forwardAuth(req) } }
    );

    await clearProductsCache();
    return res.json(response.data);
  } catch (err) {
    const status = err?.response?.status || 400;
    return res.status(status).json(
      err?.response?.data || {
        error: "CATALOG_PROXY_ERROR",
        message: "Update product failed",
      }
    );
  }
});

// DELETE product (ADMIN enforced by catalog-service)
app.delete("/api/v1/products/:id", async (req, res) => {
  try {
    await axios.delete(`${CATALOG_URL}/products/${req.params.id}`, {
      headers: { ...forwardAuth(req) },
    });

    await clearProductsCache();
    return res.status(204).send();
  } catch (err) {
    const status = err?.response?.status || 400;
    return res.status(status).json(
      err?.response?.data || {
        error: "CATALOG_PROXY_ERROR",
        message: "Delete product failed",
      }
    );
  }
});

// ======================
// CATEGORIES (Catalog)
// ======================
app.get("/api/v1/categories", async (req, res) => {
  try {
    const response = await axios.get(`${CATALOG_URL}/categories`);
    return res.json(response.data);
  } catch (err) {
    return res.status(502).json({
      error: "CATALOG_PROXY_ERROR",
      message: "Failed to fetch categories from catalog-service",
    });
  }
});

app.post("/api/v1/categories", async (req, res) => {
  try {
    const response = await axios.post(`${CATALOG_URL}/categories`, req.body, {
      headers: { ...forwardAuth(req) },
    });

    await clearProductsCache();
    return res.status(201).json(response.data);
  } catch (err) {
    const status = err?.response?.status || 400;
    return res.status(status).json(
      err?.response?.data || {
        error: "CATALOG_PROXY_ERROR",
        message: "Create category failed",
      }
    );
  }
});

app.put("/api/v1/categories/:id", async (req, res) => {
  try {
    const response = await axios.put(
      `${CATALOG_URL}/categories/${req.params.id}`,
      req.body,
      { headers: { ...forwardAuth(req) } }
    );

    await clearProductsCache();
    return res.json(response.data);
  } catch (err) {
    const status = err?.response?.status || 400;
    return res.status(status).json(
      err?.response?.data || {
        error: "CATALOG_PROXY_ERROR",
        message: "Update category failed",
      }
    );
  }
});

app.delete("/api/v1/categories/:id", async (req, res) => {
  try {
    await axios.delete(`${CATALOG_URL}/categories/${req.params.id}`, {
      headers: { ...forwardAuth(req) },
    });

    await clearProductsCache();
    return res.status(204).send();
  } catch (err) {
    const status = err?.response?.status || 400;
    return res.status(status).json(
      err?.response?.data || {
        error: "CATALOG_PROXY_ERROR",
        message: "Delete category failed",
      }
    );
  }
});

// ======================
// SEARCH (Catalog)
// ======================
app.get("/api/v1/search/products", async (req, res) => {
  try {
    const response = await axios.get(`${CATALOG_URL}/search/products`, {
      params: req.query,
    });
    return res.json(response.data);
  } catch (err) {
    const status = err?.response?.status || 400;
    return res.status(status).json(
      err?.response?.data || {
        error: "CATALOG_PROXY_ERROR",
        message: "Search failed",
      }
    );
  }
});

// ======================
// ORDERS (Order service)
// ======================

// GET all orders (ADMIN enforced by order-service)
app.get("/api/v1/orders", async (req, res) => {
  try {
    const response = await axios.get(`${ORDERS_URL}/orders`, {
      headers: { ...forwardAuth(req) },
    });
    return res.json(response.data);
  } catch (err) {
    const status = err?.response?.status || 400;
    return res.status(status).json(
      err?.response?.data || {
        error: "ORDERS_PROXY_ERROR",
        message: "Failed to fetch orders",
      }
    );
  }
});

//  POST create order (USER) - checkout
app.post("/api/v1/orders", async (req, res) => {
  try {
    const response = await axios.post(`${ORDERS_URL}/orders`, req.body, {
      headers: { ...forwardAuth(req) },
    });
    return res.status(201).json(response.data);
  } catch (err) {
    const status = err?.response?.status || 400;
    return res.status(status).json(
      err?.response?.data || {
        error: "ORDERS_PROXY_ERROR",
        message: "Create order failed",
      }
    );
  }
});

// PUT update order status (ADMIN enforced by order-service)
app.put("/api/v1/orders/:id", async (req, res) => {
  try {
    const response = await axios.put(
      `${ORDERS_URL}/orders/${req.params.id}`,
      req.body,
      { headers: { ...forwardAuth(req) } }
    );
    return res.json(response.data);
  } catch (err) {
    const status = err?.response?.status || 400;
    return res.status(status).json(
      err?.response?.data || {
        error: "ORDERS_PROXY_ERROR",
        message: "Update order failed",
      }
    );
  }
});

// ======================
// Health + Metrics
// ======================
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "gateway" });
});

app.get("/metrics", metricsEndpoint);

// ======================
// GraphQL
// ======================
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await server.start();

app.use(
  "/graphql",
  expressMiddleware(server, {
    context: async ({ req }) => ({ req }),
  })
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Gateway running on http://localhost:${PORT}`);
  console.log(`REST:   http://localhost:${PORT}/api/v1/products`);
  console.log(`GraphQL: http://localhost:${PORT}/graphql`);
  console.log(`Metrics: http://localhost:${PORT}/metrics`);
});
