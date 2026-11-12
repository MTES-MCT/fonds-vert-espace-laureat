import { NextRequest, NextResponse } from "next/server";

import { writeProgress } from "@/app/api/projets/demo/_lib/progress";
import { demoProject } from "@/utils/demo/catalogue";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dossierNumber: string }> },
) {
  const route = await params;
  const number = Number(route.dossierNumber);
  const project = String(number) === route.dossierNumber && demoProject(number);
  if (!project) {
    return NextResponse.json(
      { error: "Cible de démonstration introuvable" },
      { status: 404 },
    );
  }
  return writeProgress(request, number, project.status);
}
