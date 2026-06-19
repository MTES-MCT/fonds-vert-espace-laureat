import { resolve } from "node:path";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Scalingo runs this script from the Procfile `postdeploy` hook after the
// build, when devDependencies may have been pruned. Keep deployment migrations
// on drizzle-orm runtime APIs instead of the drizzle-kit CLI.
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required to run database migrations.");
  process.exit(1);
}

const client = postgres(databaseUrl, { max: 1 });
const db = drizzle({ client });

try {
  await migrate(db, { migrationsFolder: resolve(process.cwd(), "drizzle") });
  console.log("Database migrations applied.");
} finally {
  await client.end();
}
