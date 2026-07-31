import { and, asc, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { dossierMetricRevisions } from "@/db/schema";
import {
  isDisplayableMetricFields,
  type MetricFields,
  type Metrics,
  type MetricValue,
} from "@/services/fondsvert/dossier";
import { metricValuesEqual } from "@/utils/metrics/values";

type MetricRevisionInsert = typeof dossierMetricRevisions.$inferInsert;
type MetricRevisionRow = typeof dossierMetricRevisions.$inferSelect;
type CurrentMetricRow = Pick<
  MetricRevisionRow,
  | "metricCode"
  | "revision"
  | "label"
  | "unit"
  | "valueType"
  | "numberValue"
  | "textValue"
  | "booleanValue"
  | "textArrayValue"
>;
type MetricValueType = CurrentMetricRow["valueType"];
export type DossierMetricsState =
  | { status: "not-imported" }
  | { status: "imported"; metrics: Record<string, MetricFields> };
export type DossierMetricRevisionTarget = {
  metricCode: string;
  revision: number;
  label: string;
  unit: string | null;
  valueType: MetricValueType;
  sourceValue: MetricValue;
  effectiveValue: MetricValue;
};

export class DossierMetricRevisionError extends Error {
  constructor(
    public readonly code: "unknown-target" | "invalid-value",
    message: string,
  ) {
    super(message);
    this.name = "DossierMetricRevisionError";
  }
}

function valueColumns(
  value: MetricValue,
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
  metric: MetricFields;
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

function rowValue(row: CurrentMetricRow): MetricValue {
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

function rowsToMetrics(rows: CurrentMetricRow[]): Record<string, MetricFields> {
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

function isValidRevisionValue(
  valueType: MetricValueType,
  value: unknown,
): value is MetricValue {
  switch (valueType) {
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "text":
      return typeof value === "string" && value.trim().length > 0;
    case "boolean":
      return typeof value === "boolean";
    case "text_array":
      return (
        Array.isArray(value) &&
        value.length > 0 &&
        value.every(
          (item) => typeof item === "string" && item.trim().length > 0,
        )
      );
  }
}

function revisionRowsToTarget({
  source,
  effectiveRevision,
}: {
  source: CurrentMetricRow;
  effectiveRevision: CurrentMetricRow;
}): DossierMetricRevisionTarget {
  return {
    metricCode: source.metricCode,
    revision: effectiveRevision.revision,
    label: source.label,
    unit: source.unit,
    valueType: source.valueType,
    sourceValue: rowValue(source),
    effectiveValue: rowValue(effectiveRevision),
  };
}

export async function importDossierMetricsIfMissing({
  numeroDossier,
  metrics,
}: {
  numeroDossier: number;
  metrics: Metrics;
}): Promise<void> {
  const db = getDb();

  const revisions = Object.entries(metrics)
    .filter((entry): entry is [string, MetricFields] =>
      isDisplayableMetricFields(entry[1]),
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

  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${numeroDossier})`);

    const [storedRevision] = await tx
      .select({ metricCode: dossierMetricRevisions.metricCode })
      .from(dossierMetricRevisions)
      .where(eq(dossierMetricRevisions.dossierNumber, numeroDossier))
      .limit(1);

    if (storedRevision) {
      return;
    }

    await tx.insert(dossierMetricRevisions).values(revisions);
  });
}

export async function getDossierMetricsState({
  numeroDossier,
}: {
  numeroDossier: number;
}): Promise<DossierMetricsState> {
  const rows = await getDb()
    .selectDistinctOn(
      [dossierMetricRevisions.dossierNumber, dossierMetricRevisions.metricCode],
      {
        metricCode: dossierMetricRevisions.metricCode,
        revision: dossierMetricRevisions.revision,
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

export async function getDossierMetricRevisionTargets({
  numeroDossier,
}: {
  numeroDossier: number;
}): Promise<Record<string, DossierMetricRevisionTarget>> {
  const rows = await getDb()
    .select({
      metricCode: dossierMetricRevisions.metricCode,
      revision: dossierMetricRevisions.revision,
      label: dossierMetricRevisions.label,
      unit: dossierMetricRevisions.unit,
      valueType: dossierMetricRevisions.valueType,
      numberValue: dossierMetricRevisions.numberValue,
      textValue: dossierMetricRevisions.textValue,
      booleanValue: dossierMetricRevisions.booleanValue,
      textArrayValue: dossierMetricRevisions.textArrayValue,
    })
    .from(dossierMetricRevisions)
    .where(eq(dossierMetricRevisions.dossierNumber, numeroDossier))
    .orderBy(
      asc(dossierMetricRevisions.metricCode),
      asc(dossierMetricRevisions.revision),
    );

  return Object.fromEntries(
    Object.entries(Object.groupBy(rows, (row) => row.metricCode)).flatMap(
      ([metricCode, revisions]) => {
        const source = revisions?.at(0);
        const effectiveRevision = revisions?.at(-1);
        const target =
          source && effectiveRevision
            ? revisionRowsToTarget({ source, effectiveRevision })
            : undefined;
        return target ? [[metricCode, target]] : [];
      },
    ),
  );
}

export async function appendDossierMetricRevision({
  numeroDossier,
  metricCode,
  value,
}: {
  numeroDossier: number;
  metricCode: string;
  value: unknown;
}): Promise<DossierMetricRevisionTarget> {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${numeroDossier})`);

    const rows = await tx
      .select({
        metricCode: dossierMetricRevisions.metricCode,
        revision: dossierMetricRevisions.revision,
        label: dossierMetricRevisions.label,
        unit: dossierMetricRevisions.unit,
        valueType: dossierMetricRevisions.valueType,
        numberValue: dossierMetricRevisions.numberValue,
        textValue: dossierMetricRevisions.textValue,
        booleanValue: dossierMetricRevisions.booleanValue,
        textArrayValue: dossierMetricRevisions.textArrayValue,
      })
      .from(dossierMetricRevisions)
      .where(
        and(
          eq(dossierMetricRevisions.dossierNumber, numeroDossier),
          eq(dossierMetricRevisions.metricCode, metricCode),
        ),
      )
      .orderBy(asc(dossierMetricRevisions.revision));

    const source = rows.at(0);
    const effectiveRevision = rows.at(-1);
    const target =
      source && effectiveRevision
        ? revisionRowsToTarget({ source, effectiveRevision })
        : undefined;

    if (!target) {
      throw new DossierMetricRevisionError(
        "unknown-target",
        "Métrique inconnue pour ce dossier",
      );
    }

    if (!isValidRevisionValue(target.valueType, value)) {
      throw new DossierMetricRevisionError(
        "invalid-value",
        "Valeur invalide pour le type de la métrique",
      );
    }

    if (metricValuesEqual(target.effectiveValue, value)) {
      return target;
    }

    const revision = target.revision + 1;

    await tx.insert(dossierMetricRevisions).values({
      dossierNumber: numeroDossier,
      metricCode,
      revision,
      label: target.label,
      unit: target.unit,
      ...valueColumns(value),
    });

    return {
      ...target,
      revision,
      effectiveValue: value,
    };
  });
}
