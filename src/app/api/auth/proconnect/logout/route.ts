import { NextResponse } from "next/server";

import { proConnectLogoutUrl } from "@/services/proconnect";
import { logException } from "@/utils/error";
import { cleanSession, withSession } from "@/utils/session";
import { welcomeUrl } from "@/utils/url";

export const POST = withSession(async function logoutRoute(req) {
  if (req.headers.get("origin") !== welcomeUrl.origin) {
    return new NextResponse(null, { status: 403 });
  }
  try {
    if (!req.session.idToken) {
      await cleanSession(req.session);
      return NextResponse.redirect(welcomeUrl, 303);
    }
    const url = await proConnectLogoutUrl(req);
    return NextResponse.redirect(url, 303);
  } catch (e: unknown) {
    logException(e);
    return NextResponse.redirect(welcomeUrl, 303);
  }
});
