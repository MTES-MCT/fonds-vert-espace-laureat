import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

const preloadScript =
  "./scripts/disable-next-test-client-request-interceptor.cjs";

test("disables the Next 16.3 ClientRequest interceptor in the test server", () => {
  const result = spawnSync(
    process.execPath,
    [
      `--require=${preloadScript}`,
      "--eval",
      `
        const assert = require("node:assert/strict");
        const { ClientRequestInterceptor } = require(
          "next/dist/compiled/@mswjs/interceptors/ClientRequest"
        );

        assert.equal(
          ClientRequestInterceptor.prototype.apply.name,
          "skipNextTestClientRequestInterception"
        );
      `,
    ],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stdout + result.stderr);
});
