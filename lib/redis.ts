import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedis() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL ?? "redis://localhost:6379",
    });
    redisClient.on("error", (err) => console.error("Redis error:", err));
    try {
      await redisClient.connect();
    } catch (err) {
      console.warn("Redis unavailable, running without cache:", err);
      redisClient = null;
      return null;
    }
  }
  return redisClient;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = await getRedis();
    if (!redis) return null;
    const val = await redis.get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = 3600
): Promise<void> {
  try {
    const redis = await getRedis();
    if (!redis) return;
    await redis.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error("Redis set error:", err);
  }
}

export async function cacheInvalidate(pattern: string): Promise<void> {
  try {
    const redis = await getRedis();
    if (!redis) return;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (err) {
    console.error("Redis invalidate error:", err);
  }
}

export const CACHE_KEYS = {
  todayRepos: "repos:today",
  filteredRepos: (lang?: string, topic?: string) =>
    `repos:filtered:${lang ?? "all"}:${topic ?? "all"}`,
  repoDetail: (owner: string, name: string) => `repo:${owner}:${name}`,
  subscriberCount: "stats:subscriber_count",
};
