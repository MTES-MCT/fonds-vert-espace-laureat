import { asc, desc, eq, sql } from "drizzle-orm";

import { getDb, hasDatabaseUrl } from "@/db";
import { dossierMetricRevisions } from "@/db/schema";
import {
  isMetricFields,
  type MetricFields,
  type Metrics,
  type MetricValue,
} from "@/services/fondsvert/dossier";

type MetricRevisionInsert = typeof dossierMetricRevisions.$inferInsert;
type MetricRevisionRow = typeof dossierMetricRevisions.$inferSelect;
type CurrentMetricRow = Pick<
  MetricRevisionRow,
  | "metricCode"
  | "label"
  | "unit"
  | "valueType"
  | "numberValue"
  | "textValue"
  | "booleanValue"
  | "textArrayValue"
>;
type DisplayableMetricFields = MetricFields & {
  valeur_estimee: Exclude<MetricValue, null>;
};

export type DossierMetricsState =
  | { status: "database-unavailable" }
  | { status: "not-imported" }
  | { status: "imported"; metrics: Metrics };

function valueColumns(
  value: Exclude<MetricValue, null>,
): Pick<
  MetricRevisionInsert,
  "valueType" | "numberValue" | "textValue" | "booleanValue" | "textArrayValue"
> {
  if (typeof value === "number") {
    return {
      valueType: "number",
      numberValue: value,
      textValue: null,
      booleanValue: null,
      textArrayValue: null,
    };
  }

  if (typeof value === "string") {
    return {
      valueType: "text",
      numberValue: null,
      textValue: value,
      booleanValue: null,
      textArrayValue: null,
    };
  }

  if (typeof value === "boolean") {
    return {
      valueType: "boolean",
      numberValue: null,
      textValue: null,
      booleanValue: value,
      textArrayValue: null,
    };
  }

  return {
    valueType: "text_array",
    numberValue: null,
    textValue: null,
    booleanValue: null,
    textArrayValue: value,
  };
}

function toRevisionInsert({
  dossierNumber,
  metricCode,
  metric,
}: {
  dossierNumber: number;
  metricCode: string;
  metric: DisplayableMetricFields;
}): MetricRevisionInsert {
  return {
    dossierNumber,
    metricCode,
    revision: 1,
    label: metric.label,
    unit: metric.unite,
    ...valueColumns(metric.valeur_estimee),
  };
}

function rowValue(row: CurrentMetricRow): Exclude<MetricValue, null> {
  switch (row.valueType) {
    case "number":
      return row.numberValue!;
    case "text":
      return row.textValue!;
    case "boolean":
      return row.booleanValue!;
    case "text_array":
      return row.textArrayValue!;
  }
}

function rowsToMetrics(rows: CurrentMetricRow[]): Metrics {
  return Object.fromEntries(
    rows.map((row) => [
      row.metricCode,
      {
        label: row.label,
        unite: row.unit,
        valeur_estimee: rowValue(row),
      },
    ]),
  );
}

export async function importDossierMetricsIfMissing({
  numeroDossier,
  metrics,
}: {
  numeroDossier: number;
  metrics: Metrics;
}): Promise<void> {
  if (!hasDatabaseUrl()) {
    return;
  }

  const revisions = Object.entries(metrics)
    .filter((entry): entry is [string, DisplayableMetricFields] =>
      isMetricFields(entry[1]),
    )
    .map(([metricCode, metric]) =>
      toRevisionInsert({
        dossierNumber: numeroDossier,
        metricCode,
        metric,
      }),
    );

  if (revisions.length === 0) {
    return;
  }

  await getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${numeroDossier})`);

    const [storedRevision] = await tx
      .select({ metricCode: dossierMetricRevisions.metricCode })
      .from(dossierMetricRevisions)
      .where(eq(dossierMetricRevisions.dossierNumber, numeroDossier))
      .limit(1);

    if (storedRevision) {
      return;
    }

    await tx
      .insert(dossierMetricRevisions)
      .values(revisions)
      .onConflictDoNothing();
  });
}

export async function getDossierMetricsState({
  numeroDossier,
}: {
  numeroDossier: number;
}): Promise<DossierMetricsState> {
  if (!hasDatabaseUrl()) {
    return { status: "database-unavailable" };
  }

  const rows = await getDb()
    .selectDistinctOn(
      [dossierMetricRevisions.dossierNumber, dossierMetricRevisions.metricCode],
      {
        metricCode: dossierMetricRevisions.metricCode,
        label: dossierMetricRevisions.label,
        unit: dossierMetricRevisions.unit,
        valueType: dossierMetricRevisions.valueType,
        numberValue: dossierMetricRevisions.numberValue,
        textValue: dossierMetricRevisions.textValue,
        booleanValue: dossierMetricRevisions.booleanValue,
        textArrayValue: dossierMetricRevisions.textArrayValue,
      },
    )
    .from(dossierMetricRevisions)
    .where(eq(dossierMetricRevisions.dossierNumber, numeroDossier))
    .orderBy(
      asc(dossierMetricRevisions.dossierNumber),
      asc(dossierMetricRevisions.metricCode),
      desc(dossierMetricRevisions.revision),
    );

  if (rows.length === 0) {
    return { status: "not-imported" };
  }

  return {
    status: "imported",
    metrics: rowsToMetrics(rows),
  };
}
