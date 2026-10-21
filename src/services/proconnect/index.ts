// Documentation ProConnect
// https://partenaires.proconnect.gouv.fr/docs/fournisseur-service/implementation_technique

import {
  authorizationCodeGrant,
  buildAuthorizationUrl,
  buildEndSessionUrl,
  calculatePKCECodeChallenge,
  ClientSecretPost,
  type Configuration,
  discovery,
  enableNonRepudiationChecks,
  fetchUserInfo,
  randomNonce,
  randomPKCECodeVerifier,
  randomState,
} from "openid-client";

import { requireEnv } from "@/utils/env";
import type { RequestWithSession } from "@/utils/session";

let clientPromise: Promise<Configuration> | undefined;
const MFA_ACR_VALUES = [
  "eidas0-mfa",
  "eidas1-mfa",
  "eidas2",
  "eidas3",
] as const;

export class ProConnectMfaRequiredError extends Error {
  constructor() {
    super("ProConnect n'a pas confirmé une double authentification.");
  }
}

function getProConnectConfig() {
  const [clientId, clientSecret, discoverUrl, baseUrl] = requireEnv(
    "PROCONNECT_CLIENT_ID",
    "PROCONNECT_CLIENT_SECRET",
    "PROCONNECT_DISCOVER_URL",
    "NEXT_PUBLIC_BASE_URL",
  );

  return {
    clientId,
    clientSecret,
    discoverUrl,
    loginCallbackUrl: new URL(
      "/api/auth/proconnect/login-callback",
      baseUrl,
    ).toString(),
    logoutCallbackUrl: new URL(
      "/api/auth/proconnect/logout-callback",
      baseUrl,
    ).toString(),
  };
}

const getClient = async () => {
  const config = getProConnectConfig();
  if (!clientPromise) {
    const suffix = "/.well-known/openid-configuration";
    const discoveryUrl = new URL(config.discoverUrl);
    if (
      !discoveryUrl.pathname.endsWith(suffix) ||
      discoveryUrl.search ||
      discoveryUrl.hash
    ) {
      throw new Error("Invalid ProConnect OpenID discovery document URL");
    }
    const issuerUrl = new URL(discoveryUrl.href.slice(0, -suffix.length));
    clientPromise = discovery(
      issuerUrl,
      config.clientId,
      {
        client_secret: config.clientSecret,
        redirect_uris: [config.loginCallbackUrl],
        post_logout_redirect_uris: [config.logoutCallbackUrl],
        id_token_signed_response_alg: "RS256",
        userinfo_signed_response_alg: "RS256",
      },
      ClientSecretPost(config.clientSecret),
      { execute: [enableNonRepudiationChecks] },
    ).catch((error: unknown) => {
      clientPromise = undefined;
      throw error;
    });
  }
  return { client: await clientPromise, config };
};

export const proConnectAuthorizeUrl = async (req: RequestWithSession) => {
  const { client, config } = await getClient();

  const nonce = randomNonce();
  const state = randomState();
  const pkceCodeVerifier = randomPKCECodeVerifier();
  const codeChallenge = await calculatePKCECodeChallenge(pkceCodeVerifier);

  req.session.state = state;
  req.session.nonce = nonce;
  req.session.pkceCodeVerifier = pkceCodeVerifier;
  req.session.logoutState = undefined;
  await req.session.save();

  return buildAuthorizationUrl(client, {
    redirect_uri: config.loginCallbackUrl,
    scope: "openid given_name usual_name email siret custom idp_id",
    nonce,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    claims: JSON.stringify({
      id_token: {
        acr: { essential: true, values: MFA_ACR_VALUES },
      },
      userinfo: {
        email_verified: {
          essential: true,
        },
      },
    }),
  });
};

export type ProConnectUserInfo = {
  sub: string;
  email: string;
  siret: string;
  given_name: string;
  usual_name: string;
  idp_id: string;
  custom?: {
    email_verified?: boolean;
  };
};

export const proConnectAuthenticate = async (req: RequestWithSession) => {
  if (
    !req.session.state ||
    !req.session.nonce ||
    !req.session.pkceCodeVerifier
  ) {
    throw new Error("Missing ProConnect login transaction");
  }
  const { client, config } = await getClient();
  const callbackUrl = new URL(config.loginCallbackUrl);
  callbackUrl.search = req.nextUrl.search;
  const tokenSet = await authorizationCodeGrant(client, callbackUrl, {
    expectedNonce: req.session.nonce,
    expectedState: req.session.state,
    pkceCodeVerifier: req.session.pkceCodeVerifier,
  });

  const acr = tokenSet.claims()?.acr;
  if (!MFA_ACR_VALUES.some((value) => value === acr)) {
    throw new ProConnectMfaRequiredError();
  }

  const accessToken = tokenSet.access_token;
  if (!accessToken) {
    throw new Error("No access token");
  }

  const subject = tokenSet.claims()?.sub;
  if (!subject) throw new Error("No ID token subject");
  const userInfo = (await fetchUserInfo(
    client,
    accessToken,
    subject,
  )) as ProConnectUserInfo;
  if (typeof userInfo.email !== "string" || !userInfo.email.trim()) {
    throw new Error("ProConnect n'a pas renvoyé d'adresse email.");
  }
  req.session.nonce = undefined;
  req.session.state = undefined;
  req.session.pkceCodeVerifier = undefined;
  req.session.idToken = tokenSet.id_token;
  await req.session.save();

  return userInfo;
};

export const proConnectLogoutUrl = async (req: RequestWithSession) => {
  if (!req.session.idToken) throw new Error("No ProConnect ID token");
  const { client, config } = await getClient();
  req.session.logoutState ??= randomState();
  const url = buildEndSessionUrl(client, {
    id_token_hint: req.session.idToken,
    post_logout_redirect_uri: config.logoutCallbackUrl,
    state: req.session.logoutState,
  });
  await req.session.save();
  return url;
};
