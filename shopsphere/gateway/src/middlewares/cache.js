import { redisClient } from "../redis/redisClient.js";

// Cache GET responses. TTL default 60s.
export function cacheGet(ttlSeconds = 60) {
  return async (req, res, next) => {
    try {
      const key = `cache:${req.originalUrl}`;

      const cached = await redisClient.get(key);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        return res.json(JSON.parse(cached));
      }

      // If no cache, capture response and store it
      const originalJson = res.json.bind(res);
      res.json = async (body) => {
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(body));
        res.setHeader("X-Cache", "MISS");
        return originalJson(body);
      };

      next();
    } catch (err) {
      // never break API if redis fails
      next();
    }
  };
}
