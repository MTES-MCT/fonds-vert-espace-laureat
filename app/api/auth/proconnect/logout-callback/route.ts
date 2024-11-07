import { NextResponse } from "next/server";

import { cleanSession, withSession } from "@/utils/session";
import { welcomeUrl } from "@/utils/url";

export const GET = withSession(async function logoutCallbackRoute(req) {
  try {
    await cleanSession(req.session);
    return NextResponse.redirect(welcomeUrl);
  } catch {
    return NextResponse.redirect(welcomeUrl);
  }
});
