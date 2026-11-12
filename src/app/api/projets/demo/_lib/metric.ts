import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import {
  demoWriteRefusal,
  readDemoJson,
} from "@/app/api/projets/demo/_lib/publicWrites";
import {
  appendDossierMetricRevision,
  DossierMetricRevisionConflict,
  DossierMetricRevisionError,
} from "@/db/dossierMetrics";

export async function writeMetric(
  request: NextRequest,
  number: number,
  metricCode: string,
) {
  let value: unknown;
  let expectedRevision: unknown;

  try {
    ({ value, expectedRevision } = (await readDemoJson(request)) as {
      value?: unknown;
      expectedRevision?: unknown;
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
    expectedRevision < 1
  ) {
    return NextResponse.json(
      { error: "Révision lue invalide ou manquante" },
      { status: 400 },
    );
  }

  const refusal = await demoWriteRefusal(expectedRevision);
  if (refusal) return refusal;

  try {
    const target = await appendDossierMetricRevision({
      numeroDossier: number,
      metricCode,
      value,
      authorEmail: null,
      expectedRevision,
    });
    revalidatePath("/projets/demo", "layout");
    return NextResponse.json({ target });
  } catch (error) {
    if (error instanceof DossierMetricRevisionConflict) {
      return NextResponse.json(
        { error: error.message, target: error.target },
        { status: 409 },
      );
    }
    if (error instanceof DossierMetricRevisionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "unknown-target" ? 404 : 400 },
      );
    }

    throw error;
  }
}
