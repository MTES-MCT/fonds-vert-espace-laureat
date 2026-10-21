import { NextResponse } from "next/server";

import {
  proConnectAuthenticate,
  ProConnectMfaRequiredError,
} from "@/services/proconnect";
import { logException } from "@/utils/error";
import { setSession, withSession } from "@/utils/session";
import { buildUrl, errorUrl, getAuthenticatedReturnUrl } from "@/utils/url";

export const GET = withSession(async function loginCallbackRoute(req) {
  try {
    const userInfo = await proConnectAuthenticate(req);
    const returnTo = req.session.returnTo;
    req.session.returnTo = undefined;
    await setSession(userInfo, req.session);

    return NextResponse.redirect(getAuthenticatedReturnUrl(returnTo));
  } catch (e: unknown) {
    if (e instanceof ProConnectMfaRequiredError) {
      return NextResponse.redirect(
        buildUrl("/connexion/echec?error=mfa_required"),
      );
    }
    logException(e);
    return NextResponse.redirect(errorUrl);
  }
});
