import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ProConnectUserInfo } from "../proconnect";

type User = {
  id: string;
  email: string;
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

export const sessionOptions: SessionOptions = {
  password: process.env.IRON_SESSION_PWD as string,
  cookieName: "fonds-vert-espace-laureat-user-session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
  ttl: 86400, // 1 jour
};

export const setSession = async (
  userInfo: ProConnectUserInfo,
  session: IronSession<Session>,
) => {
  session.user = {
    id: userInfo.sub,
    email: userInfo.email,
  };
  await session.save();
};

export const cleanSession = async (session: IronSession<Session>) => {
  session.destroy();
  await session.save();
};

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
