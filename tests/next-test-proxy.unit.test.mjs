import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

const preloadScript =
  "./scripts/disable-next-test-client-request-interceptor.cjs";

test("the test preload keeps ClientRequest interception inactive", () => {
  const result = spawnSync(
    process.execPath,
    [
      `--require=${preloadScript}`,
      "--eval",
      `
        const assert = require("node:assert/strict");
        const http = require("node:http");
        const https = require("node:https");
        const { ClientRequestInterceptor } = require(
          "next/dist/compiled/@mswjs/interceptors/ClientRequest"
        );
        const originalHttpRequest = http.request;
        const originalHttpsRequest = https.request;

        const interceptor = new ClientRequestInterceptor();
        interceptor.apply();

        assert.equal(interceptor.readyState, "INACTIVE");
        assert.equal(http.request, originalHttpRequest);
        assert.equal(https.request, originalHttpsRequest);
      `,
    ],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stdout + result.stderr);
});
