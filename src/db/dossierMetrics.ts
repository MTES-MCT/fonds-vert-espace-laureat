import { eq } from "drizzle-orm";

import { getDb, hasDatabaseUrl } from "@/db";
import { dossierMetrics } from "@/db/schema";
import { Metrics } from "@/services/fondsvert/dossier";

export async function getStoredDossierMetrics({
  numeroDossier,
}: {
  numeroDossier: number;
}): Promise<Metrics | undefined> {
  if (!hasDatabaseUrl()) {
    return undefined;
  }

  const [row] = await getDb()
    .select({ metrics: dossierMetrics.metrics })
    .from(dossierMetrics)
    .where(eq(dossierMetrics.dossierNumber, numeroDossier))
    .limit(1);

  return row?.metrics;
}
