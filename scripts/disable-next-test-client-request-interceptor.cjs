const { version: nextVersion } = require("next/package.json");

if (nextVersion !== "16.4.3") {
  throw new Error(
    `The Next.js test proxy workaround targets 16.4.3, not ${nextVersion}. Re-evaluate it before upgrading Next.js.`,
  );
}

const {
  ClientRequestInterceptor,
} = require("next/dist/compiled/@mswjs/interceptors/ClientRequest");

// The test proxy already intercepts fetch. Its ClientRequest interceptor also
// patches TCP sockets and interferes with PostgreSQL queries during tests.
ClientRequestInterceptor.prototype.apply =
  function skipNextTestClientRequestInterception() {};
