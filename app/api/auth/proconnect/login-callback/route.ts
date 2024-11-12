import { NextResponse } from "next/server";

import { logException } from "@/utils/error";
import { proConnectAuthenticate } from "@/utils/proconnect";
import { setSession, withSession } from "@/utils/session";
import { dashboardUrl, errorUrl } from "@/utils/url";

export const GET = withSession(async function loginCallbackRoute(req) {
  try {
    const userInfo = await proConnectAuthenticate(req);
    await setSession(userInfo, req.session);
    return NextResponse.redirect(dashboardUrl);
  } catch (e: unknown) {
    logException(e);
    return NextResponse.redirect(errorUrl);
  }
});