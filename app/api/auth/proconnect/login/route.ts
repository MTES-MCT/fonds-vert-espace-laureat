import { NextResponse } from "next/server";

import { proConnectAuthorizeUrl } from "@/services/proconnect";
import { logException } from "@/utils/error";
import { withSession } from "@/utils/session";
import { errorUrl } from "@/utils/url";

export const GET = withSession(async function loginRoute(req) {
  try {
    const url = await proConnectAuthorizeUrl(req);
    return NextResponse.redirect(url);
  } catch (e: unknown) {
    logException(e);
    return NextResponse.redirect(errorUrl);
  }
});
