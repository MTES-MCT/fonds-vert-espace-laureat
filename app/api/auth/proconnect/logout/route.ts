import { NextResponse } from "next/server";

import { proConnectLogoutUrl } from "@/services/proconnect";
import { logException } from "@/utils/error";
import { withSession } from "@/utils/session";
import { welcomeUrl } from "@/utils/url";

export const GET = withSession(async function logoutRoute(req) {
  try {
    const url = await proConnectLogoutUrl(req);
    return NextResponse.redirect(url);
  } catch (e: unknown) {
    logException(e);
    return NextResponse.redirect(welcomeUrl);
  }
});
