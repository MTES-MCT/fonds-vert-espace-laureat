import { NextRequest, NextResponse } from "next/server";

import { writeMetric } from "@/app/api/projets/demo/_lib/metric";
import { demoProject } from "@/utils/demo/catalogue";

export async function POST(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ dossierNumber: string; metricCode: string }> },
) {
  const route = await params;
  const number = Number(route.dossierNumber);
  const project = String(number) === route.dossierNumber && demoProject(number);
  if (
    !project ||
    !Object.hasOwn(
      project.fondsVert.metrique_specifique ?? {},
      route.metricCode,
    )
  ) {
    return NextResponse.json(
      { error: "Cible de démonstration introuvable" },
      { status: 404 },
    );
  }
  return writeMetric(request, number, route.metricCode);
}
