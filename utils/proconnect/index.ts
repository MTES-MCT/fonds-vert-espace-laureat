// Documentation ProConnect
// https://github.com/numerique-gouv/proconnect-documentation/blob/main/doc_fs/implementation_technique.md

import { BaseClient, generators, Issuer } from "openid-client";

import { RequestWithSession } from "@/utils/session";

let _client = undefined as BaseClient | undefined;

const CLIENT_ID = process.env.PROCONNECT_CLIENT_ID;
const CLIENT_SECRET = process.env.PROCONNECT_CLIENT_SECRET;
const ISSUER_URL = process.env.PROCONNECT_DISCOVER_URL;
const LOGIN_CALLBACK_URL = new URL(
  "/api/auth/proconnect/login-callback",
  process.env.NEXT_PUBLIC_BASE_URL,
).toString();
const LOGOUT_CALLBACK_URL = new URL(
  "/api/auth/proconnect/logout-callback",
  process.env.NEXT_PUBLIC_BASE_URL,
).toString();

const SCOPES = "openid given_name usual_name email custom idp_id";

export const getClient = async () => {
  if (_client) {
    return _client;
  } else {
    if (
      !CLIENT_ID ||
      !ISSUER_URL ||
      !CLIENT_SECRET ||
      !LOGIN_CALLBACK_URL ||
      !LOGOUT_CALLBACK_URL
    ) {
      throw new Error("PRO CONNECT ENV variables are not defined");
    }
    const proConnectIssuer = await Issuer.discover(ISSUER_URL);

    _client = new proConnectIssuer.Client({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uris: [LOGIN_CALLBACK_URL],
      post_logout_redirect_uris: [LOGOUT_CALLBACK_URL],
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
    scope: SCOPES,
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

  const tokenSet = await client.callback(LOGIN_CALLBACK_URL, params, {
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
    post_logout_redirect_uri: LOGOUT_CALLBACK_URL,
  });
};
