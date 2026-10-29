import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import {
  appendDossierMetricRevision,
  DossierMetricRevisionConflict,
  DossierMetricRevisionError,
} from "@/db/dossierMetrics";
import { DEMO_DOSSIER_NUMBER } from "@/utils/demo";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ metricCode: string }> },
) {
  const { metricCode } = await params;
  let value: unknown;
  let expectedRevision: unknown;

  try {
    ({ value, expectedRevision } = (await request.json()) as {
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

  try {
    const target = await appendDossierMetricRevision({
      numeroDossier: DEMO_DOSSIER_NUMBER,
      metricCode,
      value,
      authorEmail: null,
      expectedRevision,
    });
    revalidatePath("/projets/demo");
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
