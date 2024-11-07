import { NextResponse } from "next/server";

import { proConnectAuthorizeUrl } from "@/utils/proconnect";
import { withSession } from "@/utils/session";
import { errorUrl } from "@/utils/url";

export const GET = withSession(async function loginRoute(req) {
  try {
    const url = await proConnectAuthorizeUrl(req);
    return NextResponse.redirect(url);
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.redirect(errorUrl);
  }
});
