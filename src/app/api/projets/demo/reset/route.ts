import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { demoWriteRefusal } from "@/app/api/projets/demo/_lib/publicWrites";
import { resetDemoCatalogue } from "@/db/publicDemoWrites";

export async function POST() {
  const refusal = await demoWriteRefusal();
  if (refusal) return refusal;
  await resetDemoCatalogue();
  revalidatePath("/projets/demo", "layout");

  return NextResponse.json({ success: true });
}
