import { NextResponse } from "next/server";

import { proConnectAuthenticate } from "@/services/proconnect";
import { logException } from "@/utils/error";
import { setSession, withSession } from "@/utils/session";
import { errorUrl, getAuthenticatedReturnUrl } from "@/utils/url";

export const GET = withSession(async function loginCallbackRoute(req) {
  try {
    const userInfo = await proConnectAuthenticate(req);
    await setSession(userInfo, req.session);

    const returnTo = req.session.returnTo;
    if (returnTo) {
      req.session.returnTo = undefined;
      await req.session.save();
    }

    return NextResponse.redirect(getAuthenticatedReturnUrl(returnTo));
  } catch (e: unknown) {
    logException(e);
    return NextResponse.redirect(errorUrl);
  }
});
