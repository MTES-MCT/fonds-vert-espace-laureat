import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSession } from "./utils/session";

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    const loginUrl = new URL("/connexion", request.url);
    loginUrl.searchParams.set("error", "user_unknown");
    loginUrl.searchParams.set("returnTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!connexion|api|espace-laureat/demo|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|$).*)",
  ],
};
