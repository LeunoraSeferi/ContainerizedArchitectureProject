import axios from "axios";
import { getRedisClient } from "../../redis/redisClient.js";

const CATALOG_URL = process.env.CATALOG_URL || "http://localhost:3002/api/v1";

// helper: always return a safe float
function toFloat(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

// cache helpers
async function getCache(key) {
  const redis = getRedisClient();
  if (!redis) return null;
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

async function setCache(key, value, ttl = 60) {
  const redis = getRedisClient();
  if (!redis) return;
  await redis.setEx(key, ttl, JSON.stringify(value));
}

async function clearProductsCache(productId = null) {
  const redis = getRedisClient();
  if (!redis) return;

  await redis.del("catalog:products:all");
  if (productId) {
    await redis.del(`catalog:products:id:${productId}`);
  }
}

export const resolvers = {
  Query: {
    //  CACHED
    products: async () => {
      const cacheKey = "catalog:products:all";

      const cached = await getCache(cacheKey);
      if (cached) return cached;

      const res = await axios.get(`${CATALOG_URL}/products`);
      await setCache(cacheKey, res.data);
      return res.data;
    },

    //  CACHED
    product: async (_, { id }) => {
      const cacheKey = `catalog:products:id:${id}`;

      const cached = await getCache(cacheKey);
      if (cached) return cached;

      const res = await axios.get(`${CATALOG_URL}/products/${id}`);
      await setCache(cacheKey, res.data);
      return res.data;
    },
  },

  Mutation: {
    //  NOT cached — invalidate instead
    createProduct: async (_, { input }) => {
      const res = await axios.post(`${CATALOG_URL}/products`, input);
      await clearProductsCache();
      return res.data;
    },

    //  NOT cached — invalidate instead
    updateProduct: async (_, { id, input }) => {
      const res = await axios.put(`${CATALOG_URL}/products/${id}`, input);
      await clearProductsCache(id);
      return res.data;
    },

    //  NOT cached — invalidate instead
    deleteProduct: async (_, { id }) => {
      await axios.delete(`${CATALOG_URL}/products/${id}`);
      await clearProductsCache(id);
      return true;
    },
  },

  // Field-level resolvers
  Product: {
    category: async (product) => {
      try {
        const res = await axios.get(`${CATALOG_URL}/categories/${product.categoryId}`);
        return res.data;
      } catch {
        return null;
      }
    },

    finalPrice: (product) => {
      return toFloat(product.price, 0);
    },
  },
};
