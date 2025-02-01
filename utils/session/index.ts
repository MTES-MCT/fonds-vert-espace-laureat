import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ProConnectUserInfo } from "@/services/proconnect";
import { requireEnv } from "@/utils/env";
import { ttl } from "@/utils/session/ttl";

type User = {
  id: string;
  email: string;
  email_verified?: boolean;
  siret: string;
};

type Session = {
  user: User | null;
  state?: string;
  nonce?: string;
  idToken?: string;
};

export type RequestWithSession = NextRequest & {
  session: IronSession<Session>;
};

const [ironSessionPwd] = requireEnv("IRON_SESSION_PWD");

export const sessionOptions: SessionOptions = {
  password: ironSessionPwd,
  cookieName: "fonds-vert-espace-laureat",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
  ttl,
};

export async function setSession(
  userInfo: ProConnectUserInfo,
  session: IronSession<Session>,
) {
  session.user = {
    id: userInfo.sub,
    email: userInfo.email,
    siret: userInfo.siret,
    email_verified: userInfo.custom.email_verified,
  };
  await session.save();
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  return await getIronSession<Session>(cookieStore, sessionOptions);
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
      sessionOptions,
    );
    return handler(reqWithSession);
  };
}
