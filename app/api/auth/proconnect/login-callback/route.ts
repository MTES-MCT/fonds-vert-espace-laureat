import { NextResponse } from "next/server";

import { proConnectAuthenticate } from "@/utils/proconnect";
import { setSession, withSession } from "@/utils/session";
import { errorUrl, welcomeUrl } from "@/utils/url";

export const GET = withSession(async function loginCallbackRoute(req) {
  try {
    const userInfo = await proConnectAuthenticate(req);
    await setSession(userInfo, req.session);
    return NextResponse.redirect(welcomeUrl);
  } catch {
    return NextResponse.redirect(errorUrl);
  }
});
