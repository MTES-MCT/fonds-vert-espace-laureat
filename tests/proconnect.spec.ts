import { createRequire } from "node:module";
import { mock } from "node:test";

import { expect, test } from "@playwright/test";
import { sealData, unsealData } from "iron-session";
import { NextRequest } from "next/server";
import {
  type CallbackParamsType,
  Issuer,
  type OpenIDCallbackChecks,
  TokenSet,
} from "openid-client";

import { GET as login } from "@/app/api/auth/proconnect/login/route";
import { GET as callback } from "@/app/api/auth/proconnect/login-callback/route";

const require = createRequire(`${process.cwd()}/package.json`);
const nextHeaders: typeof import("next/headers") = require("next/headers");
const cookieName = "fonds-vert-espace-laureat";
const password = process.env.IRON_SESSION_PWD!;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
const cookieValues = new Map<string, string>();
const identity = {
  sub: "proconnect-return-user",
  email: "laureat@example.test",
  siret: "12345678900011",
  idp_id: process.env.PROCONNECT_IDENTITE_IDP_ID,
  custom: { email_verified: true },
};
const issuer = new Issuer({
  issuer: "https://identity.example.test",
  authorization_endpoint: "https://identity.example.test/authorize",
  token_endpoint: "https://identity.example.test/token",
});

type StoredSession = {
  user?: { id: string; email: string; siret: string };
  returnTo?: string;
  state?: string;
  nonce?: string;
};

test.describe("ProConnect return after authentication", () => {
  test.beforeEach(() => {
    cookieValues.clear();
    mock.method(nextHeaders, "cookies", async () => ({
      get: (name: string) =>
        cookieValues.has(name) ? { value: cookieValues.get(name) } : undefined,
      set: (name: string, value: string) => cookieValues.set(name, value),
    }));
    mock.method(Issuer, "discover", async () => issuer);
    mock.method(
      issuer.Client.prototype,
      "callback",
      async (
        redirectUri: string,
        params: CallbackParamsType,
        checks?: OpenIDCallbackChecks,
      ) => {
        const transaction = await readSession();
        expect(redirectUri).toBe(
          new URL("/api/auth/proconnect/login-callback", baseUrl).href,
        );
        expect(params.code).toBe("test-code");
        expect(params.state).toBe(transaction.state);
        expect(checks).toMatchObject({
          state: transaction.state,
          nonce: transaction.nonce,
        });
        return new TokenSet({
          access_token: "test-token",
          id_token: "test-id",
        });
      },
    );
    mock.method(issuer.Client.prototype, "userinfo", async () => identity);
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

  async function completeLogin(returnTo?: string) {
    const loginUrl = new URL("/api/auth/proconnect/login", baseUrl);
    if (returnTo !== undefined) loginUrl.searchParams.set("returnTo", returnTo);

    const authorization = await login(new NextRequest(loginUrl));
    expect(authorization.status).toBe(307);
    const providerUrl = new URL(authorization.headers.get("location")!);
    expect(providerUrl.origin).toBe("https://identity.example.test");
    const transaction = await readSession();
    expect(transaction.returnTo).toBe(returnTo || undefined);
    expect(transaction.state).toBe(providerUrl.searchParams.get("state"));
    expect(transaction.nonce).toBe(providerUrl.searchParams.get("nonce"));

    const callbackUrl = new URL("/api/auth/proconnect/login-callback", baseUrl);
    callbackUrl.searchParams.set("code", "test-code");
    callbackUrl.searchParams.set("state", transaction.state!);
    const response = await callback(new NextRequest(callbackUrl));
    expect(response.status).toBe(307);
    const storedSession = await readSession();
    expect(storedSession.user).toMatchObject({
      id: identity.sub,
      email: identity.email,
      siret: identity.siret,
    });
    expect(storedSession.returnTo).toBeUndefined();
    expect(storedSession.state).toBeUndefined();
    expect(storedSession.nonce).toBeUndefined();
    return new URL(response.headers.get("location")!);
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

  test("a laureat with a previously sealed unsafe return falls back to the dashboard", async () => {
    cookieValues.set(
      cookieName,
      await sealData(
        {
          state: "previous-state",
          nonce: "previous-nonce",
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
    const storedSession = await readSession();
    expect(storedSession.user?.id).toBe(identity.sub);
    expect(storedSession.returnTo).toBeUndefined();
  });

  test("a failed ProConnect authentication goes to the error page without creating a user", async () => {
    const providerError = new Error("ProConnect authentication rejected");
    mock.method(issuer.Client.prototype, "callback", async () => {
      throw providerError;
    });
    const log = mock.method(console, "error", () => {});
    cookieValues.set(
      cookieName,
      await sealData(
        {
          state: "rejected-state",
          nonce: "rejected-nonce",
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
    expect(log.mock.calls[0].arguments).toEqual([providerError.message]);
  });
});

test("an unauthenticated dossier visitor keeps the dossier destination in the ProConnect link", async ({
  page,
}) => {
  await page.goto("/projets/123");
  await expect(page).toHaveURL(
    /\/connexion\?error=user_unknown&returnTo=%2Fprojets%2F123$/,
  );
  await expect(
    page.locator('a[href^="/api/auth/proconnect/login"]'),
  ).toHaveAttribute(
    "href",
    "/api/auth/proconnect/login?returnTo=%2Fprojets%2F123",
  );
});
