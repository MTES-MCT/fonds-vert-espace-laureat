import { NextRequest, NextResponse } from "next/server";

import { isProjectView } from "@/utils/projectView";
import { isAdmin } from "@/utils/roles";
import { getSession } from "@/utils/session";
import { welcomeUrl } from "@/utils/url";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Utilisateur non authentifié" },
      { status: 401 },
    );
  }
  if (!isAdmin({ userEmail: session.user.email })) {
    return NextResponse.json(
      { error: "Cette vue est réservée au super admin." },
      { status: 403 },
    );
  }
  if (request.headers.get("origin") !== welcomeUrl().origin) {
    return NextResponse.json(
      { error: "Origine non autorisée" },
      { status: 403 },
    );
  }
  let view: unknown;
  try {
    ({ view } = await request.json());
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 },
    );
  }
  if (!isProjectView(view)) {
    return NextResponse.json({ error: "Vue invalide" }, { status: 400 });
  }
  session.projectView = view;
  await session.save();
  return NextResponse.json({ view });
}
