import { drizzle } from "drizzle-orm/postgres-js";

type Database = ReturnType<typeof drizzle>;

const poolMax = process.env.NODE_ENV === "production" ? 10 : 3;

const globalForDb = globalThis as typeof globalThis & {
  vertImpactDb?: Database;
};

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb() {
  if (!globalForDb.vertImpactDb) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required to initialize Drizzle.");
    }

    globalForDb.vertImpactDb = drizzle({
      connection: {
        url: databaseUrl,
        max: poolMax,
      },
    });
  }

  return globalForDb.vertImpactDb;
}

export async function closeDb() {
  if (globalForDb.vertImpactDb) {
    await globalForDb.vertImpactDb.$client.end();
    globalForDb.vertImpactDb = undefined;
  }
}
