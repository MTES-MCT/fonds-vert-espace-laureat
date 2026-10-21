import {
  createHash,
  createSign,
  generateKeyPairSync,
  type KeyObject,
} from "node:crypto";
import { createRequire } from "node:module";
import { mock } from "node:test";

import { expect, test } from "@playwright/test";
import { sealData, unsealData } from "iron-session";
import { NextRequest } from "next/server";

import { GET as login } from "@/app/api/auth/proconnect/login/route";
import { GET as callback } from "@/app/api/auth/proconnect/login-callback/route";
import { POST as logout } from "@/app/api/auth/proconnect/logout/route";
import { GET as logoutCallback } from "@/app/api/auth/proconnect/logout-callback/route";
import { type Session, sessionOptions } from "@/utils/session";

import { authenticatePage } from "./setup/auth";

const require = createRequire(`${process.cwd()}/package.json`);
const nextHeaders: typeof import("next/headers") = require("next/headers");
const { cookieName, password } = sessionOptions;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
const cookieValues = new Map<string, string>();
let cookieWriteCount = 0;
const identity = {
  sub: "proconnect-return-user",
  email: "laureat@example.test",
  siret: "12345678900011",
  idp_id: process.env.PROCONNECT_IDENTITE_IDP_ID,
  custom: { email_verified: true },
};
const discoveryUrl = process.env.PROCONNECT_DISCOVER_URL!;
const issuerUrl = discoveryUrl.replace("/.well-known/openid-configuration", "");
const signingKeys = generateKeyPairSync("rsa", { modulusLength: 2048 });
const wrongKeys = generateKeyPairSync("rsa", { modulusLength: 2048 });
type StoredSession = Partial<Session>;
let tokenRequest: URLSearchParams | undefined;
let tokenClaims: Record<string, unknown>;
let userInfoClaims: Record<string, unknown>;
let invalidIdSignature: boolean;
let invalidUserInfoSignature: boolean;
let unsignedUserInfo: boolean;
let missingAccessToken: boolean;
let providerFailure: boolean;
let discoveryIssuer: string;
let discoveryUnavailable = false;
let rejectCookieWrite = false;
const providerRequests: string[] = [];
const validVerifier = "A".repeat(43);
let expectedChallenge: string;

function pkceChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

function signedJwt(claims: Record<string, unknown>, key: KeyObject) {
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", kid: "provider-key" }),
  ).toString("base64url");
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const input = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256")
    .update(input)
    .sign(key)
    .toString("base64url");
  return `${input}.${signature}`;
}

test.describe("ProConnect return after authentication", () => {
  test.describe.configure({ mode: "default" });
  test.beforeEach(() => {
    cookieValues.clear();
    cookieWriteCount = 0;
    rejectCookieWrite = false;
    tokenRequest = undefined;
    tokenClaims = { acr: "eidas1-mfa" };
    userInfoClaims = {};
    invalidIdSignature = false;
    invalidUserInfoSignature = false;
    unsignedUserInfo = false;
    missingAccessToken = false;
    providerFailure = false;
    expectedChallenge = pkceChallenge(validVerifier);
    discoveryIssuer = issuerUrl;
    discoveryUnavailable = false;
    providerRequests.length = 0;
    mock.method(nextHeaders, "cookies", async () => ({
      get: (name: string) =>
        cookieValues.has(name) ? { value: cookieValues.get(name) } : undefined,
      set: (name: string, value: string) => {
        if (rejectCookieWrite) throw new Error("Session cookie write failed");
        cookieWriteCount += 1;
        cookieValues.set(name, value);
      },
    }));
    mock.method(
      globalThis,
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = new Request(input, init);
        const address = new URL(request.url);
        providerRequests.push(address.pathname);
        const now = Math.floor(Date.now() / 1000);
        if (address.href === discoveryUrl) {
          if (discoveryUnavailable) return new Response(null, { status: 503 });
          return Response.json({
            issuer: discoveryIssuer,
            authorization_endpoint: `${issuerUrl}/authorize`,
            token_endpoint: `${issuerUrl}/token`,
            userinfo_endpoint: `${issuerUrl}/userinfo`,
            jwks_uri: `${issuerUrl}/jwks`,
            end_session_endpoint: `${issuerUrl}/logout`,
            token_endpoint_auth_methods_supported: ["client_secret_post"],
            code_challenge_methods_supported: ["S256"],
            id_token_signing_alg_values_supported: ["RS256"],
            userinfo_signing_alg_values_supported: ["RS256"],
          });
        }
        if (address.href === `${issuerUrl}/jwks`) {
          return Response.json({
            keys: [
              {
                ...signingKeys.publicKey.export({ format: "jwk" }),
                kid: "provider-key",
                alg: "RS256",
                use: "sig",
              },
            ],
          });
        }
        if (address.href === `${issuerUrl}/token`) {
          tokenRequest = new URLSearchParams(await request.text());
          expect(request.method).toBe("POST");
          expect(tokenRequest.get("client_id")).toBe(
            process.env.PROCONNECT_CLIENT_ID,
          );
          expect(tokenRequest.get("client_secret")).toBe(
            process.env.PROCONNECT_CLIENT_SECRET,
          );
          expect(tokenRequest.get("redirect_uri")).toBe(
            new URL("/api/auth/proconnect/login-callback", baseUrl).href,
          );
          if (
            pkceChallenge(tokenRequest.get("code_verifier") ?? "") !==
            expectedChallenge
          ) {
            return Response.json({ error: "invalid_grant" }, { status: 400 });
          }
          if (providerFailure)
            return Response.json({ error: "invalid_grant" }, { status: 400 });
          const transaction = await readSession();
          return Response.json({
            access_token: missingAccessToken ? undefined : "test-token",
            token_type: "Bearer",
            id_token: signedJwt(
              {
                iss: issuerUrl,
                aud: process.env.PROCONNECT_CLIENT_ID,
                sub: identity.sub,
                iat: now,
                exp: now + 300,
                nonce: transaction.nonce,
                ...tokenClaims,
              },
              invalidIdSignature
                ? wrongKeys.privateKey
                : signingKeys.privateKey,
            ),
          });
        }
        if (address.href === `${issuerUrl}/userinfo`) {
          expect(request.headers.get("authorization")).toBe(
            "Bearer test-token",
          );
          const claims = {
            iss: issuerUrl,
            aud: process.env.PROCONNECT_CLIENT_ID,
            iat: now,
            exp: now + 300,
            ...identity,
            ...userInfoClaims,
          };
          if (unsignedUserInfo) return Response.json(claims);
          return new Response(
            signedJwt(
              claims,
              invalidUserInfoSignature
                ? wrongKeys.privateKey
                : signingKeys.privateKey,
            ),
            { headers: { "content-type": "application/jwt" } },
          );
        }
        throw new Error(`Unexpected provider request: ${address.href}`);
      },
    );
  });
  test.afterEach(() => {
    mock.restoreAll();
    cookieValues.clear();
  });

  async function readSession() {
    return unsealData<StoredSession>(cookieValues.get(cookieName)!, {
      password,
    });
  }

  async function completeLogin(returnTo?: string, callbackOrigin = baseUrl) {
    const loginUrl = new URL("/api/auth/proconnect/login", baseUrl);
    if (returnTo !== undefined) loginUrl.searchParams.set("returnTo", returnTo);

    const authorization = await login(new NextRequest(loginUrl));
    expect(authorization.status).toBe(307);
    const providerUrl = new URL(authorization.headers.get("location")!);
    expect(providerUrl.origin).toBe(new URL(issuerUrl).origin);
    expect(providerUrl.searchParams.get("scope")).toBe(
      "openid given_name usual_name email siret custom idp_id",
    );
    expect(providerUrl.searchParams.has("acr_values")).toBe(false);
    expect(JSON.parse(providerUrl.searchParams.get("claims")!)).toEqual({
      id_token: {
        acr: {
          essential: true,
          values: ["eidas0-mfa", "eidas1-mfa", "eidas2", "eidas3"],
        },
      },
      userinfo: { email_verified: { essential: true } },
    });
    const transaction = await readSession();
    expectedChallenge = providerUrl.searchParams.get("code_challenge")!;
    expect(providerUrl.searchParams.get("code_challenge_method")).toBe("S256");
    expect(transaction.pkceCodeVerifier).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
    expect(expectedChallenge).toBe(
      pkceChallenge(transaction.pkceCodeVerifier!),
    );
    expect(providerUrl.searchParams.has("code_verifier")).toBe(false);
    expect(transaction.returnTo).toBe(returnTo || undefined);
    expect(transaction.state).toBe(providerUrl.searchParams.get("state"));
    expect(transaction.nonce).toBe(providerUrl.searchParams.get("nonce"));

    const callbackUrl = new URL(
      "/api/auth/proconnect/login-callback",
      callbackOrigin,
    );
    callbackUrl.searchParams.set("code", "test-code");
    callbackUrl.searchParams.set("state", transaction.state!);
    const cookieWritesBeforeCallback = cookieWriteCount;
    const response = await callback(new NextRequest(callbackUrl));
    expect(response.status).toBe(307);
    expect(cookieWriteCount - cookieWritesBeforeCallback).toBe(2);
    expect(tokenRequest?.get("code")).toBe("test-code");
    expect(tokenRequest?.get("code_verifier")).toBe(
      transaction.pkceCodeVerifier,
    );
    const storedSession = await readSession();
    expect(storedSession.user).toMatchObject({
      id: identity.sub,
      email: identity.email,
      siret: identity.siret,
      isProConnectIdentityProvider: true,
      isSiretVerifiedForEmailDomain: true,
    });
    expect(storedSession.idToken).toBeTruthy();
    expect(storedSession.returnTo).toBeUndefined();
    expect(storedSession.state).toBeUndefined();
    expect(storedSession.nonce).toBeUndefined();
    expect(storedSession.pkceCodeVerifier).toBeUndefined();
    return new URL(response.headers.get("location")!);
  }

  test("a provider discovery failure during logout preserves the local session and redirects with 303", async () => {
    const authenticated: StoredSession = {
      user: {
        id: identity.sub,
        email: identity.email,
        siret: identity.siret,
        isProConnectIdentityProvider: true,
        isSiretVerifiedForEmailDomain: true,
      },
      idToken: "existing-provider-id-token",
    };
    await storeSession(authenticated);
    const cookie = cookieValues.get(cookieName);
    discoveryUnavailable = true;
    const log = mock.method(console, "error", () => {});
    const response = await logout(logoutRequest());
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(new URL("/", baseUrl).href);
    expect(cookieValues.get(cookieName)).toBe(cookie);
    expect(cookieWriteCount).toBe(0);
    expect((await readSession()).user).toEqual(authenticated.user);
    expect(log.mock.calls[0].arguments[0]).toBe(
      "unexpected HTTP response status code",
    );
    expect(providerRequests).toEqual([new URL(discoveryUrl).pathname]);
  });

  test("a mismatched discovery issuer is rejected and a subsequent discovery can recover", async () => {
    discoveryIssuer = "https://attacker.example";
    const log = mock.method(console, "error", () => {});
    const response = await login(
      new NextRequest(new URL("/api/auth/proconnect/login", baseUrl)),
    );
    expect(response.headers.get("location")).toBe(
      new URL("/connexion/echec", baseUrl).href,
    );
    expect(cookieWriteCount).toBe(0);
    expect(log.mock.calls).toHaveLength(1);

    discoveryIssuer = issuerUrl;
    expect((await completeLogin()).pathname).toBe("/projets");
    expect(
      providerRequests.filter((path) => path.endsWith("openid-configuration")),
    ).toHaveLength(2);
  });

  for (const origin of ["https://0.0.0.0:29882", "https://localhost:4000"]) {
    test(`a callback received at ${origin} exchanges the code with the public callback URL`, async () => {
      const destination = await completeLogin(
        "/projets/123?onglet=impact",
        origin,
      );

      expect(tokenRequest?.get("redirect_uri")).toBe(
        new URL("/api/auth/proconnect/login-callback", baseUrl).href,
      );
      expect(destination.href).toBe(
        new URL("/projets/123?onglet=impact", baseUrl).href,
      );
    });
  }

  test("a callback without a login transaction cannot create a user", async () => {
    const log = mock.method(console, "error", () => {});
    const response = await invokeCallback("code=test-code&state=state");
    expect(response.headers.get("location")).toBe(
      new URL("/connexion/echec", baseUrl).href,
    );
    expect(cookieWriteCount).toBe(0);
    expect(providerRequests).toHaveLength(0);
    expect(log.mock.calls).toHaveLength(1);
  });

  for (const acr of ["eidas0-mfa", "eidas1-mfa", "eidas2", "eidas3"]) {
    test(`a laureat with signed MFA assurance ${acr} can log in`, async () => {
      tokenClaims.acr = acr;

      expect((await completeLogin()).pathname).toBe("/projets");
    });
  }

  for (const [situation, acr] of [
    ["missing assurance", undefined],
    ["single-factor eidas0 assurance", "eidas0"],
    ["single-factor eidas1 assurance", "eidas1"],
    ["unknown assurance", "eidas1-mfa-extra"],
    ["an array instead of an assurance string", ["eidas1-mfa"]],
  ] as const) {
    test(`a laureat with ${situation} cannot establish a session or fetch UserInfo`, async () => {
      await storeSession({ state: "state", nonce: "nonce" });
      const previousCookie = cookieValues.get(cookieName);
      tokenClaims.acr = acr;

      const response = await invokeCallback("code=test-code&state=state");

      expect(response.headers.get("location")).toBe(
        new URL("/connexion/echec?error=mfa_required", baseUrl).href,
      );
      expect(tokenRequest?.get("code")).toBe("test-code");
      expect(providerRequests).not.toContain(
        new URL(`${issuerUrl}/userinfo`).pathname,
      );
      expect(cookieWriteCount).toBe(0);
      expect(cookieValues.get(cookieName)).toBe(previousCookie);
      expect((await readSession()).user).toBeUndefined();
    });
  }

  for (const missing of ["state", "nonce", "pkceCodeVerifier"] as const) {
    test(`a sealed login transaction without ${missing} is rejected before code exchange`, async () => {
      await storeSession({
        state: "state",
        nonce: "nonce",
        [missing]: undefined,
      });
      mock.method(console, "error", () => {});
      const response = await invokeCallback("code=test-code&state=state");
      expect(response.headers.get("location")).toBe(
        new URL("/connexion/echec", baseUrl).href,
      );
      expect(tokenRequest).toBeUndefined();
      expect(cookieWriteCount).toBe(0);
      expect((await readSession()).user).toBeUndefined();
    });
  }

  for (const [situation, mutate, query] of [
    ["missing callback state", () => {}, "code=test-code"],
    ["incorrect callback state", () => {}, "code=test-code&state=wrong"],
    ["provider rejection", () => {}, "error=access_denied&state=state"],
    [
      "incorrect nonce",
      () => {
        tokenClaims.nonce = "wrong";
      },
    ],
    [
      "incorrect ID token issuer",
      () => {
        tokenClaims.iss = "https://attacker.example";
      },
    ],
    [
      "incorrect ID token audience",
      () => {
        tokenClaims.aud = "other-client";
      },
    ],
    [
      "expired ID token",
      () => {
        tokenClaims.exp = 1;
      },
    ],
    [
      "invalid ID token signature",
      () => {
        invalidIdSignature = true;
      },
    ],
    [
      "invalid UserInfo signature",
      () => {
        invalidUserInfoSignature = true;
      },
    ],
    [
      "unsigned UserInfo",
      () => {
        unsignedUserInfo = true;
      },
    ],
    [
      "different UserInfo subject",
      () => {
        userInfoClaims.sub = "other-person";
      },
    ],
    [
      "incorrect UserInfo issuer",
      () => {
        userInfoClaims.iss = "https://attacker.example";
      },
    ],
    [
      "incorrect UserInfo audience",
      () => {
        userInfoClaims.aud = "other-client";
      },
    ],
    [
      "missing access token",
      () => {
        missingAccessToken = true;
      },
    ],
  ] as const) {
    test(`a laureat receiving ${situation} reaches the error page without a session`, async () => {
      await storeSession({ state: "state", nonce: "nonce" });
      mutate();
      const log = mock.method(console, "error", () => {});
      const response = await invokeCallback(
        query ?? "code=test-code&state=state",
      );
      expect(response.headers.get("location")).toBe(
        new URL("/connexion/echec", baseUrl).href,
      );
      expect((await readSession()).user).toBeUndefined();
      expect(cookieWriteCount).toBe(0);
      if (query) {
        expect(tokenRequest).toBeUndefined();
      } else {
        expect(tokenRequest?.get("code")).toBe("test-code");
      }
      const userInfoReached = providerRequests.includes(
        new URL(`${issuerUrl}/userinfo`).pathname,
      );
      expect(userInfoReached).toBe(situation.includes("UserInfo"));
      expect(log.mock.calls[0].arguments[0]).toMatch(
        /invalid response|unexpected JWT claim|JWT timestamp|unexpected JSON attribute|authorization response.*error|JWT UserInfo Response expected/,
      );
      expect(log.mock.calls).toHaveLength(1);
    });
  }

  test("an identity from another provider preserves the unverified SIRET interpretation", async () => {
    userInfoClaims.idp_id = "other-provider";
    userInfoClaims.custom = { email_verified: false };
    await storeSession({ state: "state", nonce: "nonce" });
    const response = await invokeCallback("code=test-code&state=state");
    expect(response.headers.get("location")).toBe(
      new URL("/projets", baseUrl).href,
    );
    expect((await readSession()).user).toMatchObject({
      id: identity.sub,
      email: identity.email,
      siret: identity.siret,
      isProConnectIdentityProvider: false,
      isSiretVerifiedForEmailDomain: false,
    });
  });

  for (const [situation, email] of [
    ["a missing email", undefined],
    ["a null email", null],
    ["a numeric email", 42],
    ["an empty email", ""],
    ["a whitespace-only email", "   "],
  ] as const) {
    test(`a laureat with ${situation} in signed UserInfo cannot establish a session`, async () => {
      await storeSession({ state: "state", nonce: "nonce" });
      const previousCookie = cookieValues.get(cookieName);
      userInfoClaims.email = email;
      const log = mock.method(console, "error", () => {});

      const response = await invokeCallback("code=test-code&state=state");

      expect(response.headers.get("location")).toBe(
        new URL("/connexion/echec", baseUrl).href,
      );
      expect(providerRequests).toContain(
        new URL(`${issuerUrl}/userinfo`).pathname,
      );
      expect(log.mock.calls[0].arguments).toEqual([
        "ProConnect n'a pas renvoyé d'adresse email.",
      ]);
      expect(cookieWriteCount).toBe(0);
      expect(cookieValues.get(cookieName)).toBe(previousCookie);
      expect((await readSession()).user).toBeUndefined();
    });
  }

  for (const [situation, custom] of [
    ["custom claims", undefined],
    ["the SIRET verification claim", {}],
  ] as const) {
    test(`a laureat without ${situation} can log in without a verification flag`, async () => {
      userInfoClaims.custom = custom;
      await storeSession({ state: "state", nonce: "nonce" });

      const response = await invokeCallback("code=test-code&state=state");

      expect(response.headers.get("location")).toBe(
        new URL("/projets", baseUrl).href,
      );
      expect((await readSession()).user).toMatchObject({
        id: identity.sub,
        email: identity.email,
        siret: identity.siret,
      });
      expect(
        (await readSession()).user?.isSiretVerifiedForEmailDomain,
      ).toBeUndefined();
      expect((await readSession()).pkceCodeVerifier).toBeUndefined();
    });
  }

  test("a code exchanged with another PKCE verifier is rejected by the provider", async () => {
    await storeSession({
      state: "state",
      nonce: "nonce",
      pkceCodeVerifier: "B".repeat(43),
    });
    const log = mock.method(console, "error", () => {});
    const response = await invokeCallback("code=test-code&state=state");
    expect(response.headers.get("location")).toBe(
      new URL("/connexion/echec", baseUrl).href,
    );
    expect(tokenRequest?.get("code_verifier")).toBe("B".repeat(43));
    expect(providerRequests).not.toContain(
      new URL(`${issuerUrl}/userinfo`).pathname,
    );
    expect(log.mock.calls[0].arguments[0]).toBe(
      "server responded with an error in the response body",
    );
    expect(cookieWriteCount).toBe(0);
    expect((await readSession()).user).toBeUndefined();
  });

  test("two login starts use distinct PKCE challenges and complete with their own sealed transactions", async () => {
    const transactions = [];
    for (let start = 0; start < 2; start++) {
      const response = await login(
        new NextRequest(new URL("/api/auth/proconnect/login", baseUrl)),
      );
      const authorization = new URL(response.headers.get("location")!);
      const session = await readSession();
      transactions.push({
        session,
        challenge: authorization.searchParams.get("code_challenge")!,
        cookie: cookieValues.get(cookieName)!,
      });
      expect(authorization.searchParams.get("code_challenge_method")).toBe(
        "S256",
      );
      expect(authorization.searchParams.has("code_verifier")).toBe(false);
      expect(authorization.searchParams.has("pkceCodeVerifier")).toBe(false);
    }
    expect(transactions[0].session.state).not.toBe(
      transactions[1].session.state,
    );
    expect(transactions[0].session.nonce).not.toBe(
      transactions[1].session.nonce,
    );
    expect(transactions[0].session.pkceCodeVerifier).not.toBe(
      transactions[1].session.pkceCodeVerifier,
    );
    expect(transactions[0].challenge).not.toBe(transactions[1].challenge);

    for (const { session, challenge, cookie } of transactions) {
      cookieValues.set(cookieName, cookie);
      expectedChallenge = challenge;
      expect(challenge).toBe(pkceChallenge(session.pkceCodeVerifier!));
      const response = await invokeCallback(
        `code=test-code&state=${session.state}`,
      );
      expect(response.headers.get("location")).toBe(
        new URL("/projets", baseUrl).href,
      );
      expect(tokenRequest?.get("code_verifier")).toBe(session.pkceCodeVerifier);
      expect((await readSession()).pkceCodeVerifier).toBeUndefined();
    }
  });

  function logoutRequest(origin: string | null = new URL(baseUrl).origin) {
    return new NextRequest(new URL("/api/auth/proconnect/logout", baseUrl), {
      method: "POST",
      headers: origin === null ? {} : { origin },
    });
  }

  async function invokeLogoutCallback(query: string) {
    return logoutCallback(
      new NextRequest(
        new URL(`/api/auth/proconnect/logout-callback?${query}`, baseUrl),
      ),
    );
  }

  test("a laureat logs out through ProConnect and clears the local session only after the matching return", async () => {
    await completeLogin();
    const authenticated = await readSession();
    const response = await logout(logoutRequest());
    expect(response.status).toBe(303);
    const providerLogout = new URL(response.headers.get("location")!);
    expect(providerLogout.href.startsWith(`${issuerUrl}/logout?`)).toBe(true);
    expect(providerLogout.searchParams.get("id_token_hint")).toBe(
      authenticated.idToken,
    );
    expect(providerLogout.searchParams.get("post_logout_redirect_uri")).toBe(
      new URL("/api/auth/proconnect/logout-callback", baseUrl).href,
    );
    const pending = await readSession();
    expect(pending.logoutState).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(providerLogout.searchParams.get("state")).toBe(pending.logoutState);
    expect(pending.user).toEqual(authenticated.user);

    const returned = await invokeLogoutCallback(`state=${pending.logoutState}`);
    expect(returned.headers.get("location")).toBe(new URL("/", baseUrl).href);
    const loggedOut = await readSession();
    expect(loggedOut.user).toBeUndefined();
    expect(loggedOut.idToken).toBeUndefined();
    expect(loggedOut.logoutState).toBeUndefined();
  });

  test("a repeated logout POST preserves the first provider return", async () => {
    await completeLogin();
    const first = await logout(logoutRequest());
    const firstUrl = new URL(first.headers.get("location")!);
    const second = await logout(logoutRequest());
    expect(second.status).toBe(303);
    expect(
      new URL(second.headers.get("location")!).searchParams.get("state"),
    ).toBe(firstUrl.searchParams.get("state"));
    await invokeLogoutCallback(`state=${firstUrl.searchParams.get("state")}`);
    expect((await readSession()).user).toBeUndefined();
  });

  for (const [situation, origin] of [
    ["external origin", "https://attacker.example"],
    ["missing origin", null],
    ["opaque origin", "null"],
    ["different local port", "http://localhost:4999"],
  ] as const) {
    test(`a logout POST from ${situation} preserves the authenticated session`, async () => {
      await completeLogin();
      const cookie = cookieValues.get(cookieName);
      cookieWriteCount = 0;
      providerRequests.length = 0;
      const response = await logout(logoutRequest(origin));
      expect(response.status).toBe(403);
      expect(response.headers.has("location")).toBe(false);
      expect(cookieValues.get(cookieName)).toBe(cookie);
      expect(cookieWriteCount).toBe(0);
      expect(providerRequests).toHaveLength(0);
    });
  }

  for (const [situation, transaction, query] of [
    ["without a pending logout", undefined, "state=unsolicited"],
    ["without a returned state", "expected-state", ""],
    ["with an empty returned state", "expected-state", "state="],
    ["with a wrong returned state", "expected-state", "state=other-state"],
  ] as const) {
    test(`a logout callback ${situation} preserves the existing user and token`, async () => {
      await completeLogin();
      await storeSession({
        ...(await readSession()),
        logoutState: transaction,
      });
      const cookie = cookieValues.get(cookieName);
      cookieWriteCount = 0;
      const response = await invokeLogoutCallback(query);
      expect(response.headers.get("location")).toBe(new URL("/", baseUrl).href);
      expect(cookieValues.get(cookieName)).toBe(cookie);
      expect(cookieWriteCount).toBe(0);
      expect((await readSession()).user?.id).toBe(identity.sub);
    });
  }

  test("a session without an ID token logs out locally with a GET redirect", async () => {
    await completeLogin();
    await storeSession({ ...(await readSession()), idToken: undefined });
    providerRequests.length = 0;
    const response = await logout(logoutRequest());
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(new URL("/", baseUrl).href);
    expect((await readSession()).user).toBeUndefined();
    expect(providerRequests).toHaveLength(0);
  });

  test("a fresh login invalidates a pending logout callback", async () => {
    await completeLogin();
    await logout(logoutRequest());
    const previous = await readSession();
    await login(
      new NextRequest(new URL("/api/auth/proconnect/login", baseUrl)),
    );
    expect((await readSession()).logoutState).toBeUndefined();
    cookieWriteCount = 0;
    await invokeLogoutCallback(`state=${previous.logoutState}`);
    expect(cookieWriteCount).toBe(0);
    expect((await readSession()).user).toEqual(previous.user);
  });

  test("failure to save a logout transaction redirects with 303 and keeps the existing session", async () => {
    await completeLogin();
    const cookie = cookieValues.get(cookieName);
    rejectCookieWrite = true;
    const log = mock.method(console, "error", () => {});
    const response = await logout(logoutRequest());
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(new URL("/", baseUrl).href);
    expect(cookieValues.get(cookieName)).toBe(cookie);
    expect(log.mock.calls[0].arguments).toEqual([
      "Session cookie write failed",
    ]);
  });

  async function storeSession(session: StoredSession) {
    cookieValues.set(
      cookieName,
      await sealData(
        { pkceCodeVerifier: validVerifier, ...session },
        { password },
      ),
    );
  }

  async function invokeCallback(query: string) {
    return callback(
      new NextRequest(
        new URL(`/api/auth/proconnect/login-callback?${query}`, baseUrl),
      ),
    );
  }

  for (const [situation, returnTo] of [
    ["an absolute external URL", "https://attacker.example/path"],
    ["a protocol-relative external URL", "//attacker.example/path"],
    ["an encoded tab between slashes", "/\t/attacker.example/path"],
    ["an encoded newline between slashes", "/\n/attacker.example/path"],
    ["an encoded carriage return between slashes", "/\r/attacker.example/path"],
    ["a backslash authority", "/\\attacker.example/path"],
    [
      "an authority with user information",
      "/\t/localhost:4000@attacker.example/path",
    ],
    ["a different local port", "/\t/localhost:4999/path"],
    ["a malformed authority", "/\t/[invalid/path"],
    ["a relative path", "projets"],
  ]) {
    test(`laureat returning to ${situation} stays on the project dashboard`, async () => {
      const destination = await completeLogin(returnTo);
      expect(destination.href).toBe(new URL("/projets", baseUrl).href);
    });
  }

  for (const [situation, returnTo, expectedPath] of [
    ["without a return destination", undefined, "/projets"],
    [
      "to a dossier with a query and fragment",
      "/projets/123?onglet=impact#metriques",
      "/projets/123?onglet=impact#metriques",
    ],
    ["to the home page", "/", "/"],
    [
      "to a normalized local path",
      "/projets/../projets?filtre=actif",
      "/projets?filtre=actif",
    ],
    [
      "to an encoded local path",
      "/projets/%C3%A9nergie",
      "/projets/%C3%A9nergie",
    ],
    [
      "to a local query containing a backslash",
      "/projets?texte=a\\b",
      "/projets?texte=a\\b",
    ],
    [
      "to a local path without double decoding",
      "/%09/attacker.example/path",
      "/%09/attacker.example/path",
    ],
  ]) {
    test(`laureat returning ${situation} keeps the intended local destination`, async () => {
      const destination = await completeLogin(returnTo);
      expect(destination.href).toBe(new URL(expectedPath!, baseUrl).href);
    });
  }

  for (const [situation, returnTo] of [
    ["no return destination", undefined],
    ["an empty return destination", ""],
  ]) {
    test(`a laureat restarting login with ${situation} discards the previous dossier destination`, async () => {
      cookieValues.set(
        cookieName,
        await sealData(
          {
            state: "abandoned-state",
            nonce: "abandoned-nonce",
            returnTo: "/projets/123",
          },
          { password },
        ),
      );

      const destination = await completeLogin(returnTo);
      expect(destination.href).toBe(new URL("/projets", baseUrl).href);
    });
  }

  test("a laureat with a previously sealed unsafe return falls back to the dashboard", async () => {
    cookieValues.set(
      cookieName,
      await sealData(
        {
          state: "previous-state",
          nonce: "previous-nonce",
          pkceCodeVerifier: validVerifier,
          returnTo: "/\t/attacker.example/path",
        },
        { password },
      ),
    );
    const response = await callback(
      new NextRequest(
        new URL(
          "/api/auth/proconnect/login-callback?code=test-code&state=previous-state",
          baseUrl,
        ),
      ),
    );
    expect(response.headers.get("location")).toBe(
      new URL("/projets", baseUrl).href,
    );
    expect(tokenRequest?.get("code")).toBe("test-code");
    expect(cookieWriteCount).toBe(2);
    const storedSession = await readSession();
    expect(storedSession.user?.id).toBe(identity.sub);
    expect(storedSession.returnTo).toBeUndefined();
  });

  test("a failed ProConnect authentication goes to the error page without creating a user", async () => {
    providerFailure = true;
    const log = mock.method(console, "error", () => {});
    cookieValues.set(
      cookieName,
      await sealData(
        {
          state: "rejected-state",
          nonce: "rejected-nonce",
          pkceCodeVerifier: validVerifier,
          returnTo: "/\t/attacker.example/path",
        },
        { password },
      ),
    );
    const response = await callback(
      new NextRequest(
        new URL(
          "/api/auth/proconnect/login-callback?code=test-code&state=rejected-state",
          baseUrl,
        ),
      ),
    );
    expect(response.headers.get("location")).toBe(
      new URL("/connexion/echec", baseUrl).href,
    );
    expect((await readSession()).user).toBeUndefined();
    expect(cookieWriteCount).toBe(0);
    expect(log.mock.calls).toHaveLength(1);
  });
});

for (const [situation, destination] of [
  ["a dossier", "/projets/123"],
  ["a project search", "/projets?siret=12345678900011&dossier=123"],
]) {
  test(`an unauthenticated visitor to ${situation} keeps the destination in the ProConnect link`, async ({
    page,
  }) => {
    await page.goto(destination);
    await expect(page).toHaveURL(/\/connexion\?/);
    const connexionUrl = new URL(page.url());
    expect(connexionUrl.searchParams.get("error")).toBe("user_unknown");
    expect(connexionUrl.searchParams.get("returnTo")).toBe(destination);
    await expect(
      page.locator('a[href^="/api/auth/proconnect/login"]'),
    ).toHaveAttribute(
      "href",
      `/api/auth/proconnect/login?returnTo=${encodeURIComponent(destination)}`,
    );
  });
}

test("a GET logout request cannot modify an authenticated browser session", async ({
  page,
}) => {
  await authenticatePage(page);
  const before = (await page.context().cookies()).find(
    (cookie) => cookie.name === cookieName,
  )!;
  const response = await page.request.get("/api/auth/proconnect/logout", {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(405);
  expect(response.headers()["set-cookie"]).toBeUndefined();
  expect(response.headers()["location"]).toBeUndefined();
  const after = (await page.context().cookies()).find(
    (cookie) => cookie.name === cookieName,
  )!;
  expect(after.value).toBe(before.value);
});
