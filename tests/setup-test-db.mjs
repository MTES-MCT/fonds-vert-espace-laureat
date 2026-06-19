import {
  prepareDatabaseServer,
  recreateDatabase,
  run,
  testDatabaseUrl,
} from "../scripts/lib/dev-db.mjs";

const databaseUrl =
  process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? testDatabaseUrl;

await prepareDatabaseServer();
await recreateDatabase(databaseUrl);

run("bun", ["run", "db:migrate"], {
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
  },
});

console.log(`Test database ready at ${databaseUrl}`);
