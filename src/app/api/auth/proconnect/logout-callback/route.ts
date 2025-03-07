import { NextResponse } from "next/server";

import { logException } from "@/utils/error";
import { cleanSession, withSession } from "@/utils/session";
import { welcomeUrl } from "@/utils/url";

export const GET = withSession(async function logoutCallbackRoute(req) {
  try {
    await cleanSession(req.session);
    return NextResponse.redirect(welcomeUrl);
  } catch (e: unknown) {
    logException(e);
    return NextResponse.redirect(welcomeUrl);
  }
});
