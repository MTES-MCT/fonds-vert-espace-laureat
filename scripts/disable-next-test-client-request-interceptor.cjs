const { version: nextVersion } = require("next/package.json");
const testedNextVersion = "16.4.6";

if (nextVersion !== testedNextVersion) {
  throw new Error(
    `The Next.js test proxy workaround targets ${testedNextVersion}, not ${nextVersion}. Re-evaluate it before upgrading Next.js.`,
  );
}

const {
  ClientRequestInterceptor,
} = require("next/dist/compiled/@mswjs/interceptors/ClientRequest");

// The test proxy already intercepts fetch. Its ClientRequest interceptor also
// patches TCP sockets and interferes with PostgreSQL queries during tests.
ClientRequestInterceptor.prototype.apply =
  function skipNextTestClientRequestInterception() {};
