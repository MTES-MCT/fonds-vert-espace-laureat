import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ProConnectUserInfo } from "@/services/proconnect";
import { requireEnv } from "@/utils/env";
import { ttl } from "@/utils/session/ttl";

type User = {
  id: string;
  isProConnectIdentityProvider: boolean;
  email: string;
  isSiretVerifiedForEmailDomain?: boolean;
  siret: string;
};

export type Session = {
  user: User | null;
  state?: string;
  nonce?: string;
  pkceCodeVerifier?: string;
  logoutState?: string;
  idToken?: string;
  returnTo?: string;
};

export type RequestWithSession = NextRequest & {
  session: IronSession<Session>;
};

export function getSessionOptions(): SessionOptions {
  const [ironSessionPwd] = requireEnv("IRON_SESSION_PWD");

  return {
    password: ironSessionPwd,
    cookieName: "fonds-vert-espace-laureat",
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
    ttl,
  };
}

export async function setSession(
  userInfo: ProConnectUserInfo,
  session: IronSession<Session>,
) {
  const [proconnectIdentiteIdpId] = requireEnv("PROCONNECT_IDENTITE_IDP_ID");
  session.user = {
    id: userInfo.sub,
    email: userInfo.email,
    siret: userInfo.siret,
    // With ProConnect, email_verified=true means the siret has been manually verified by against the email domain.
    // This is only supported by ProConnect Identité (other FI returns email_verified=false).
    // Note: the user email itself is always verified, automatically.
    isSiretVerifiedForEmailDomain: userInfo.custom?.email_verified,
    isProConnectIdentityProvider: userInfo.idp_id === proconnectIdentiteIdpId,
  };
  await session.save();
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  return await getIronSession<Session>(cookieStore, getSessionOptions());
}

export async function getAuthenticatedUser(): Promise<User> {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    throw new Error("L'utilisateur n'est pas authentifié");
  }

  return user;
}

export async function cleanSession(session: IronSession<Session>) {
  session.destroy();
  await session.save();
}

export function withSession(
  handler: (req: RequestWithSession) => Promise<NextResponse>,
) {
  return async (req: NextRequest) => {
    const reqWithSession = req as RequestWithSession;
    const cookieStore = await cookies();
    reqWithSession.session = await getIronSession<Session>(
      cookieStore,
      getSessionOptions(),
    );
    return handler(reqWithSession);
  };
}
