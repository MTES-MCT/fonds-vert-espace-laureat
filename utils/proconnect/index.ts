// Documentation ProConnect
// https://github.com/numerique-gouv/proconnect-documentation/blob/main/doc_fs/implementation_technique.md

import { BaseClient, generators, Issuer } from "openid-client";

import { requireEnv } from "@/utils/env";
import { RequestWithSession } from "@/utils/session";

let _client = undefined as BaseClient | undefined;

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
  if (_client) {
    return _client;
  } else {
    const proConnectIssuer = await Issuer.discover(discoverUrl);

    _client = new proConnectIssuer.Client({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uris: [loginCallbackUrl],
      post_logout_redirect_uris: [logoutCallbackUrl],
      id_token_signed_response_alg: "RS256",
      userinfo_signed_response_alg: "RS256",
    });

    return _client;
  }
};

export const proConnectAuthorizeUrl = async (req: RequestWithSession) => {
  const client = await getClient();

  const nonce = generators.nonce();
  const state = generators.state();

  req.session.state = state;
  req.session.nonce = nonce;
  await req.session.save();

  return client.authorizationUrl({
    scope: "openid given_name usual_name email siret custom idp_id",
    acr_values: "eidas1",
    nonce,
    state,
    claims: {
      userinfo: {
        email_verified: {
          essential: true,
        },
      },
    },
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
  const client = await getClient();

  const params = client.callbackParams(req.nextUrl.toString());

  const tokenSet = await client.callback(loginCallbackUrl, params, {
    nonce: req.session.nonce,
    state: req.session.state,
  });

  const accessToken = tokenSet.access_token;
  if (!accessToken) {
    throw new Error("No access token");
  }

  const userInfo = (await client.userinfo(tokenSet)) as ProConnectUserInfo;
  req.session.nonce = undefined;
  req.session.state = undefined;
  req.session.idToken = tokenSet.id_token;
  await req.session.save();

  return userInfo;
};

export const proConnectLogoutUrl = async (req: RequestWithSession) => {
  const client = await getClient();
  return client.endSessionUrl({
    id_token_hint: req.session.idToken,
    post_logout_redirect_uri: logoutCallbackUrl,
  });
};
