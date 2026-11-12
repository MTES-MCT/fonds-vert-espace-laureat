import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("binds Docker PostgreSQL explicitly to the local IPv4 address", () => {
  const composeConfig = readFileSync("docker-compose.yml", "utf8");

  assert.match(composeConfig, /"127\.0\.0\.1:5433:5432"/);
});
