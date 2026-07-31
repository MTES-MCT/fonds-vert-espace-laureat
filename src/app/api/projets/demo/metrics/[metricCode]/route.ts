import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import {
  appendDossierMetricRevision,
  DossierMetricRevisionError,
} from "@/db/dossierMetrics";
import { DEMO_DOSSIER_NUMBER } from "@/utils/demo";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ metricCode: string }> },
) {
  const { metricCode } = await params;
  let value: unknown;

  try {
    ({ value } = (await request.json()) as { value?: unknown });
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 },
    );
  }

  try {
    const target = await appendDossierMetricRevision({
      numeroDossier: DEMO_DOSSIER_NUMBER,
      metricCode,
      value,
    });
    revalidatePath("/projets/demo");
    return NextResponse.json({ target });
  } catch (error) {
    if (error instanceof DossierMetricRevisionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.code === "unknown-target" ? 404 : 400 },
      );
    }

    throw error;
  }
}
