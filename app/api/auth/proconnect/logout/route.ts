import { NextResponse } from "next/server";

import { proConnectLogoutUrl } from "@/utils/proconnect";
import { withSession } from "@/utils/session";
import { welcomeUrl } from "@/utils/url";

export const GET = withSession(async function logoutRoute(req) {
  try {
    const url = await proConnectLogoutUrl(req);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(welcomeUrl);
  }
});
