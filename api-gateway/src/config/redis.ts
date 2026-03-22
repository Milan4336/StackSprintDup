import Redis from "ioredis";
import { env } from "./env";

const redisUrl = env.REDIS_URI || "redis://redis:6379";

export const redisClient = new Redis(redisUrl, {
  retryStrategy: (times) => {
    console.log(`Redis retry attempt ${times}`);
    return Math.min(times * 50, 2000);
  },
});

redisClient.on("connect", () => {
  console.log("Redis connected");
});

redisClient.on("ready", () => {
  console.log("Redis ready");
});

redisClient.on("error", (err) => {
  if (err && err.message) {
    console.error("Redis error:", err.message);
  }
});
