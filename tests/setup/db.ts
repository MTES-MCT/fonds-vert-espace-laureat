import postgres from "postgres";

import {
  getDossierMetricsState,
  importDossierMetricsIfMissing,
} from "@/db/dossierMetrics";
import { Metrics } from "@/services/fondsvert/dossier";

function getTestDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for database-backed tests.");
  }

  return databaseUrl;
}

export function createTestDatabaseClient(): postgres.Sql {
  return postgres(getTestDatabaseUrl(), { max: 1 });
}

export async function deleteStoredDossierMetrics(dossierNumber: number) {
  const sql = createTestDatabaseClient();

  try {
    await sql`
      delete from dossier_metric_revisions
      where dossier_number = ${dossierNumber}
    `;
  } finally {
    await sql.end();
  }
}

export async function getStoredDossierMetrics(dossierNumber: number) {
  const state = await getDossierMetricsState({
    numeroDossier: dossierNumber,
  });

  return state.status === "imported" ? state.metrics : undefined;
}

export async function importStoredDossierMetricsIfMissing({
  dossierNumber,
  metrics,
}: {
  dossierNumber: number;
  metrics: Metrics;
}) {
  await importDossierMetricsIfMissing({
    numeroDossier: dossierNumber,
    metrics,
  });
}
