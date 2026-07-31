import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getDossierAccess } from "@/app/projets/_components/getDossier";
import {
  appendDossierMetricRevision,
  DossierMetricRevisionError,
} from "@/db/dossierMetrics";
import { getAuthenticatedUser } from "@/utils/session";

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ dossierNumber: string; metricCode: string }>;
  },
) {
  const { dossierNumber, metricCode } = await params;
  const numeroDossier = Number(dossierNumber);

  if (!Number.isInteger(numeroDossier)) {
    return NextResponse.json(
      { error: "Numéro de dossier invalide" },
      { status: 400 },
    );
  }

  let user;
  try {
    user = await getAuthenticatedUser();
  } catch {
    return NextResponse.json(
      { error: "Utilisateur non authentifié" },
      { status: 401 },
    );
  }

  const canAccessDossier = await getDossierAccess({
    numeroDossier,
    userEmail: user.email,
  });

  if (!canAccessDossier) {
    return NextResponse.json(
      { error: "Accès refusé à ce dossier" },
      { status: 403 },
    );
  }

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
      numeroDossier,
      metricCode,
      value,
    });
    revalidatePath(`/projets/${numeroDossier}`);
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
