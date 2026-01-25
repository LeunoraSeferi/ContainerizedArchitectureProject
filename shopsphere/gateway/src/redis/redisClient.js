import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// ✅ EXPORT redisClient (this fixes your error)
export const redisClient = createClient({ url: REDIS_URL });

// Optional helper (if you ever want to import a function)
export function getRedisClient() {
  return redisClient;
}

redisClient.on("error", (err) => {
  console.error(" Redis error:", err.message);
});

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log(" Redis connected:", REDIS_URL);
  }
}
