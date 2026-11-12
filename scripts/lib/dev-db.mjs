import { execFileSync, spawnSync } from "node:child_process";
import postgres from "postgres";

export const devDatabaseUrl = "postgres://vert_impact:vert_impact@localhost:5433/vert_impact";
export const testDatabaseUrl = "postgres://vert_impact:vert_impact@localhost:5433/vert_impact_test";

const localDatabaseHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function isLocalDatabaseHost(hostname) {
  return localDatabaseHosts.has(hostname.toLowerCase().replace(/\.$/, ""));
}

export function assertLocalDatabasePort(url) {
  const parsedUrl = new URL(url);
  if (isLocalDatabaseHost(parsedUrl.hostname) && parsedUrl.port !== "5433") {
    throw new Error(
      "Les bases locales Vert Impact utilisent le port 5433. Vérifiez l’URL de connexion.",
    );
  }
}

export function getTestDatabaseName(url) {
  const name = getDatabaseName(url);
  if (!name.endsWith("_test")) {
    throw new Error(
      "La base à recréer pour les tests doit porter un nom terminé par _test.",
    );
  }
  assertLocalDatabasePort(url);
  return name;
}

export function run(command, args, options = {}) {
  return execFileSync(command, args, {
    stdio: "inherit",
    ...options,
  });
}

export function runQuiet(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    ...options,
  });
  const output = [result.stderr, result.stdout].filter(Boolean).join("\n");

  return {
    ok: result.status === 0,
    output,
    status: result.status,
  };
}

export async function prepareDatabaseServer(databaseUrl = devDatabaseUrl) {
  if (databaseUrl === devDatabaseUrl || databaseUrl === testDatabaseUrl) {
    const postgresContainer = runQuiet("docker", ["compose", "up", "-d", "postgres"]);

    if (!postgresContainer.ok) {
      throw new Error(
        [
          "Docker Compose n'a pas réussi à démarrer PostgreSQL.",
          postgresContainer.output.trim() || "Aucun détail fourni par Docker.",
        ].join("\n"),
      );
    }
  }

  await waitForDatabase(databaseUrl);
}

export async function recreateDatabase(url) {
  const databaseName = getTestDatabaseName(url);
  const adminUrl = getAdminDatabaseUrl(url);

  await prepareDatabaseServer(url);
  await waitForDatabase(adminUrl);

  const adminDb = postgres(adminUrl, { max: 1 });

  try {
    await adminDb.unsafe(`drop database if exists ${databaseName} with (force)`);
    await adminDb.unsafe(`create database ${databaseName}`);
  } finally {
    await adminDb.end().catch(() => {});
  }
}

async function waitForDatabase(url) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const sql = postgres(url, { max: 1 });

    try {
      await sql`select 1`;
      await sql.end();
      return;
    } catch {
      await sql.end().catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error("PostgreSQL service did not become ready in time");
}

function getDatabaseName(url) {
  const databaseName = new URL(url).pathname.replace(/^\//, "");

  if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
    throw new Error(`Invalid database name: ${databaseName}`);
  }

  return databaseName;
}

function getAdminDatabaseUrl(url) {
  const adminUrl = new URL(url);
  adminUrl.pathname = "/postgres";

  return adminUrl.toString();
}
