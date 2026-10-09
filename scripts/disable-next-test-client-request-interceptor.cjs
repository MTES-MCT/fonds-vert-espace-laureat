const { version: nextVersion } = require("next/package.json");

if (nextVersion !== "16.3.8") {
  throw new Error(
    `The Next.js test proxy workaround targets 16.3.8, not ${nextVersion}. Re-evaluate it before upgrading Next.js.`,
  );
}

const {
  ClientRequestInterceptor,
} = require("next/dist/compiled/@mswjs/interceptors/ClientRequest");

// Next 16.3.8's test proxy already intercepts fetch. Its additional
// ClientRequest interceptor also catches the proxy's own request and deadlocks
// concurrent server-rendered Playwright navigations before the MSW handlers
// can respond.
ClientRequestInterceptor.prototype.apply =
  function skipNextTestClientRequestInterception() {};
