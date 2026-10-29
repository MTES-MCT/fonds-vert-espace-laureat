import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import {
  appendDossierProgressRevision,
  DossierProgressConflict,
  DossierProgressError,
} from "@/db/dossierProgress";
import { DEMO_DOSSIER_NUMBER } from "@/utils/demo";

export async function POST(request: NextRequest) {
  let status: unknown;
  let expectedRevision: unknown;
  let confirmed: unknown;
  try {
    ({ status, expectedRevision, confirmed } = await request.json());
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 },
    );
  }
  if (
    typeof expectedRevision !== "number" ||
    !Number.isInteger(expectedRevision) ||
    expectedRevision < 0
  ) {
    return NextResponse.json(
      { error: "Révision lue invalide ou manquante" },
      { status: 400 },
    );
  }

  try {
    const target = await appendDossierProgressRevision({
      numeroDossier: DEMO_DOSSIER_NUMBER,
      status,
      expectedRevision,
      authorEmail: null,
      confirmed: confirmed === true,
    });
    revalidatePath("/projets/demo");
    return NextResponse.json({ target });
  } catch (error) {
    if (error instanceof DossierProgressConflict)
      return NextResponse.json(
        { error: error.message, target: error.target },
        { status: 409 },
      );
    if (error instanceof DossierProgressError)
      return NextResponse.json({ error: error.message }, { status: 400 });
    throw error;
  }
}
