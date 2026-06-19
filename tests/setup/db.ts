import postgres, { type JSONValue } from "postgres";

import { Metrics } from "@/services/fondsvert/dossier";

function getTestDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for database-backed tests.");
  }

  return databaseUrl;
}

export async function deleteStoredDossierMetrics(dossierNumber: number) {
  const sql = postgres(getTestDatabaseUrl(), { max: 1 });

  try {
    await sql`
      delete from dossier_metrics
      where dossier_number = ${dossierNumber}
    `;
  } finally {
    await sql.end();
  }
}

export async function upsertStoredDossierMetrics({
  dossierNumber,
  metrics,
}: {
  dossierNumber: number;
  metrics: Metrics;
}) {
  const sql = postgres(getTestDatabaseUrl(), { max: 1 });

  try {
    await sql`
      insert into dossier_metrics (dossier_number, metrics)
      values (${dossierNumber}, ${sql.json(metrics as JSONValue)})
      on conflict (dossier_number)
      do update set
        metrics = excluded.metrics,
        updated_at = now()
    `;
  } finally {
    await sql.end();
  }
}
