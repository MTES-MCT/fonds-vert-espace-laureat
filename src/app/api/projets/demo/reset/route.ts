import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { resetDemoDossierMetrics } from "@/db/demoMetrics";

export async function POST() {
  await resetDemoDossierMetrics();
  revalidatePath("/projets/demo");

  return NextResponse.json({ success: true });
}
