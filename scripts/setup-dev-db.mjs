import { devDatabaseUrl, prepareDatabaseServer, runQuiet } from "./lib/dev-db.mjs";

const databaseUrl = process.env.DATABASE_URL ?? devDatabaseUrl;

function runSetupStep(label, command, args) {
  console.log(`\n${label}`);

  const result = runQuiet(command, args, {
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  if (result.output.trim()) {
    console.log(result.output.trim());
  }

  if (!result.ok) {
    console.error(`\n${label} a échoué.`);
    process.exit(result.status || 1);
  }
}

console.log(`Preparing development database at ${databaseUrl}`);

try {
  await prepareDatabaseServer(databaseUrl);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

runSetupStep("Migrations Drizzle", "bun", ["run", "db:migrate"]);

console.log("\nBase de développement prête.");
