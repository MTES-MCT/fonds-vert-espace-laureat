import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ProConnectUserInfo } from "@/services/proconnect";
import { requireEnv } from "@/utils/env";
import type { ProjectView } from "@/utils/projectView";
import { ttl } from "@/utils/session/ttl";

type User = {
  id: string;
  email: string;
  siret: string;
};

export type Session = {
  user: User | null;
  projectView?: ProjectView;
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
  session.user = {
    id: userInfo.sub,
    email: userInfo.email,
    siret: userInfo.siret,
  };
  await session.save();
}

export async function getSession(): Promise<IronSession<Session>> {
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

export function cleanSession(session: IronSession<Session>) {
  session.destroy();
}

export function withSession(
  handler: (req: RequestWithSession) => Promise<NextResponse>,
) {
  return async (req: NextRequest) => {
    const reqWithSession = req as RequestWithSession;
    reqWithSession.session = await getSession();
    return handler(reqWithSession);
  };
}
