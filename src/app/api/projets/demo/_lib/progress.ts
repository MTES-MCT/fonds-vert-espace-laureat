import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import {
  demoWriteRefusal,
  readDemoJson,
} from "@/app/api/projets/demo/_lib/publicWrites";
import {
  appendDossierProgressRevision,
  DossierProgressConflict,
  DossierProgressError,
} from "@/db/dossierProgress";
import type { DossierProgressStatus } from "@/utils/dossierProgress";

export async function writeProgress(
  request: NextRequest,
  number: number,
  initialStatus: DossierProgressStatus | null,
) {
  let status: unknown;
  let expectedRevision: unknown;
  let confirmed: unknown;
  try {
    ({ status, expectedRevision, confirmed } = (await readDemoJson(
      request,
    )) as {
      status?: unknown;
      expectedRevision?: unknown;
      confirmed?: unknown;
    });
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

  const refusal = await demoWriteRefusal();
  if (refusal) return refusal;

  try {
    const target = await appendDossierProgressRevision({
      numeroDossier: number,
      status,
      expectedRevision,
      initialStatus,
      authorEmail: null,
      confirmed: confirmed === true,
    });
    revalidatePath("/projets/demo", "layout");
    return NextResponse.json({ target });
  } catch (error) {
    if (error instanceof DossierProgressConflict)
      return NextResponse.json(
        { error: error.message, target: error.target },
        { status: 409 },
      );
    if (error instanceof DossierProgressError)
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "revision-limit" ? 409 : 400 },
      );
    throw error;
  }
}
