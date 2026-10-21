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
import { RequestWithSession } from "@/utils/session";

let clientPromise: Promise<Configuration> | undefined;

const [clientId, clientSecret, discoverUrl, baseUrl] = requireEnv(
  "PROCONNECT_CLIENT_ID",
  "PROCONNECT_CLIENT_SECRET",
  "PROCONNECT_DISCOVER_URL",
  "NEXT_PUBLIC_BASE_URL",
);

const loginCallbackUrl = new URL(
  "/api/auth/proconnect/login-callback",
  baseUrl,
).toString();

const logoutCallbackUrl = new URL(
  "/api/auth/proconnect/logout-callback",
  baseUrl,
).toString();

export const getClient = async () => {
  if (!clientPromise) {
    const suffix = "/.well-known/openid-configuration";
    const discoveryUrl = new URL(discoverUrl);
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
      clientId,
      {
        client_secret: clientSecret,
        redirect_uris: [loginCallbackUrl],
        post_logout_redirect_uris: [logoutCallbackUrl],
        id_token_signed_response_alg: "RS256",
        userinfo_signed_response_alg: "RS256",
      },
      ClientSecretPost(clientSecret),
      { execute: [enableNonRepudiationChecks] },
    ).catch((error: unknown) => {
      clientPromise = undefined;
      throw error;
    });
  }
  return clientPromise;
};

export const proConnectAuthorizeUrl = async (req: RequestWithSession) => {
  const client = await getClient();

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
    redirect_uri: loginCallbackUrl,
    scope: "openid given_name usual_name email siret custom idp_id",
    acr_values: "eidas1",
    nonce,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    claims: JSON.stringify({
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
  custom: {
    email_verified: boolean;
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
  const client = await getClient();
  const callbackUrl = new URL(loginCallbackUrl);
  callbackUrl.search = req.nextUrl.search;
  const tokenSet = await authorizationCodeGrant(client, callbackUrl, {
    expectedNonce: req.session.nonce,
    expectedState: req.session.state,
    pkceCodeVerifier: req.session.pkceCodeVerifier,
  });

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
  req.session.nonce = undefined;
  req.session.state = undefined;
  req.session.pkceCodeVerifier = undefined;
  req.session.idToken = tokenSet.id_token;
  await req.session.save();

  return userInfo;
};

export const proConnectLogoutUrl = async (req: RequestWithSession) => {
  if (!req.session.idToken) throw new Error("No ProConnect ID token");
  const client = await getClient();
  req.session.logoutState ??= randomState();
  const url = buildEndSessionUrl(client, {
    id_token_hint: req.session.idToken,
    post_logout_redirect_uri: logoutCallbackUrl,
    state: req.session.logoutState,
  });
  await req.session.save();
  return url;
};
