import { spawnSync } from "node:child_process";

function normalizeTestEnv(env = process.env) {
  const normalizedEnv = { ...env };

  delete normalizedEnv.NO_COLOR;

  return normalizedEnv;
}

function runSetup(env = process.env) {
  return spawnSync(process.execPath, ["tests/setup-test-db.mjs"], {
    env: normalizeTestEnv(env),
    encoding: "utf8",
    stdio: ["inherit", "pipe", "pipe"],
  });
}

export default async function globalSetup() {
  const setup = runSetup();

  if (setup.stdout) {
    process.stdout.write(setup.stdout);
  }

  if (setup.stderr) {
    process.stderr.write(setup.stderr);
  }

  if (setup.status !== 0) {
    throw new Error("Playwright test database setup failed.");
  }
}
