import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import test from "node:test";

import {
  devDatabaseUrl,
  getTestDatabaseName,
  testDatabaseUrl,
} from "../scripts/lib/dev-db.mjs";

const require = createRequire(import.meta.url);
const playwrightCli = require.resolve("@playwright/test/cli");
const applicationDatabase =
  "postgres://vert_impact:vert_impact@localhost:5433/vert_impact";
const isolatedDatabase =
  "postgres://vert_impact:vert_impact@localhost:5433/vert_impact_test";

for (const name of [
  "vert_impact_test",
  "vert_impact_upstream_test",
  "custom_test",
]) {
  test(`the test database policy accepts the dedicated database ${name}`, () => {
    const url = new URL(isolatedDatabase);
    url.pathname = name;

    assert.equal(getTestDatabaseName(url.href), name);
  });
}

const entries = [
  {
    entry: "the standard Playwright configuration",
    args: [playwrightCli, "test", "--list", "--config=playwright.config.ts"],
  },
  { entry: "the standard test setup", args: ["tests/setup-test-db.mjs"] },
];

for (const { entry, args } of entries) {
  for (const explicitTestUrl of [false, true]) {
    const situation = explicitTestUrl
      ? "an explicit test URL pointing to the application database"
      : "the application URL inherited from the shell";
    test(`${entry} refuses ${situation} before preparing the database`, () => {
      const env = { ...process.env, DATABASE_URL: applicationDatabase };
      delete env.TEST_DATABASE_URL;
      if (explicitTestUrl) {
        env.DATABASE_URL = isolatedDatabase;
        env.TEST_DATABASE_URL = applicationDatabase;
      }

      const result = spawnSync(process.execPath, args, {
        env,
        encoding: "utf8",
        timeout: 5000,
      });

      assert.equal(result.status, 1, result.stdout + result.stderr);
      assert.match(result.stderr, /nom terminé par _test/);
      assert.doesNotMatch(
        result.stdout + result.stderr,
        /migrations applied|Test database ready/,
      );
    });
  }
}

test("the database helper refuses to recreate an application database before connecting", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      'const { recreateDatabase } = await import(process.argv[1]); await recreateDatabase("postgres://test:test@127.0.0.1:1/vert_impact");',
      new URL("../scripts/lib/dev-db.mjs", import.meta.url).href,
    ],
    { encoding: "utf8", timeout: 5000 },
  );

  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /nom terminé par _test/);
  assert.doesNotMatch(result.stderr, /ECONNREFUSED|did not become ready/);
});

test("development and test defaults use the dedicated Vert Impact port", () => {
  assert.equal(devDatabaseUrl, applicationDatabase);
  assert.equal(testDatabaseUrl, isolatedDatabase);
});

for (const host of [
  "localhost:5432",
  "127.0.0.1:5432",
  "[::1]:5432",
  "localhost",
  "LOCALHOST:5432",
  "localhost.:5432",
  "LoCaLhOsT.:5432",
]) {
  test(`local test preparation refuses the shared PostgreSQL endpoint ${host}`, () => {
    assert.throws(
      () =>
        getTestDatabaseName(
          `postgres://vert_impact:vert_impact@${host}/vert_impact_test`,
        ),
      /port 5433/,
    );
  });
}

for (const host of ["LOCALHOST", "localhost.", "LoCaLhOsT."]) {
  test(`the dedicated local port accepts the equivalent hostname ${host}`, () => {
    assert.equal(
      getTestDatabaseName(`postgres://test:test@${host}:5433/custom_test`),
      "custom_test",
    );
  });
}

test("an explicitly configured remote test database retains its own port", () => {
  assert.equal(
    getTestDatabaseName(
      "postgres://test:test@database.example.test:5432/custom_test",
    ),
    "custom_test",
  );
});

for (const { entry, args } of entries) {
  test(`${entry} refuses a stale local port before preparing the database`, () => {
    const result = spawnSync(process.execPath, args, {
      env: {
        ...process.env,
        DATABASE_URL:
          "postgres://vert_impact:vert_impact@127.0.0.1:1/vert_impact_test",
        TEST_DATABASE_URL:
          "postgres://vert_impact:vert_impact@127.0.0.1:1/vert_impact_test",
      },
      encoding: "utf8",
      timeout: 5000,
    });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /port 5433/);
    assert.doesNotMatch(
      result.stdout + result.stderr,
      /migrations applied|Test database ready/,
    );
  });
}
