import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getDossierAccess } from "@/app/projets/_components/getDossier";
import {
  appendDossierProgressRevision,
  DossierProgressConflict,
  DossierProgressError,
} from "@/db/dossierProgress";
import { getAuthenticatedUser } from "@/utils/session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dossierNumber: string }> },
) {
  const { dossierNumber } = await params;
  const numeroDossier = Number(dossierNumber);
  if (!Number.isInteger(numeroDossier))
    return NextResponse.json(
      { error: "Numéro de dossier invalide" },
      { status: 400 },
    );

  let user;
  try {
    user = await getAuthenticatedUser();
  } catch {
    return NextResponse.json(
      { error: "Utilisateur non authentifié" },
      { status: 401 },
    );
  }
  if (!(await getDossierAccess({ numeroDossier, userEmail: user.email }))) {
    return NextResponse.json(
      { error: "Accès refusé à ce dossier" },
      { status: 403 },
    );
  }

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
      numeroDossier,
      status,
      expectedRevision,
      authorEmail: user.email,
      confirmed: confirmed === true,
    });
    revalidatePath(`/projets/${numeroDossier}`);
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
