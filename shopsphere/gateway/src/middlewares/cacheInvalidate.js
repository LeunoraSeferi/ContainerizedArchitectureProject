import { redisClient } from "../redis/redisClient.js";


export async function clearProductsCache() {
  const keys = await redisClient.keys("cache:/api/v1/products*");
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
}
