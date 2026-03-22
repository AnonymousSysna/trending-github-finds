import { PrismaClient } from "@prisma/client";

// Lazy singleton — PrismaClient is only constructed on first use,
// so dotenv has time to load DATABASE_URL before this runs.
let _client: PrismaClient | undefined;

function getClient(): PrismaClient {
  if (!_client) {
    _client = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
  return _client;
}

// Proxy lets all existing `prisma.xxx` calls work without changes.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    return Reflect.get(getClient(), prop, getClient());
  },
});
