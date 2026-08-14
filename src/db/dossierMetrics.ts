import { and, asc, desc, eq, sql } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";

import { getDb } from "@/db";
import { dossierMetricRevisions } from "@/db/schema";
import {
  type MetricFields,
  type Metrics,
  type MetricValue,
} from "@/services/fondsvert/dossier";
import {
  classifyMetricValue,
  isDisplayableMetricFields,
} from "@/utils/metrics/guards";
import {
  metricValuesEqual,
  normalizeMetricValue,
} from "@/utils/metrics/values";

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
const currentMetricSelection = {
  metricCode: dossierMetricRevisions.metricCode,
  revision: dossierMetricRevisions.revision,
  label: dossierMetricRevisions.label,
  unit: dossierMetricRevisions.unit,
  valueType: dossierMetricRevisions.valueType,
  numberValue: dossierMetricRevisions.numberValue,
  textValue: dossierMetricRevisions.textValue,
  booleanValue: dossierMetricRevisions.booleanValue,
  textArrayValue: dossierMetricRevisions.textArrayValue,
};
export type DossierMetricsState =
  | { status: "not-imported" }
  | { status: "imported"; metrics: Record<string, MetricFields> };
export type DossierMetricsSnapshot =
  | {
      status: "not-imported";
      targets: Record<string, DossierMetricRevisionTarget>;
    }
  | {
      status: "imported";
      metrics: Record<string, MetricFields>;
      targets: Record<string, DossierMetricRevisionTarget>;
    };
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
  const classifiedValue = classifyMetricValue(value);

  if (classifiedValue.valueType === "number") {
    return {
      valueType: classifiedValue.valueType,
      numberValue: classifiedValue.value,
      textValue: null,
      booleanValue: null,
      textArrayValue: null,
    };
  }

  if (classifiedValue.valueType === "text") {
    return {
      valueType: classifiedValue.valueType,
      numberValue: null,
      textValue: classifiedValue.value,
      booleanValue: null,
      textArrayValue: null,
    };
  }

  if (classifiedValue.valueType === "boolean") {
    return {
      valueType: classifiedValue.valueType,
      numberValue: null,
      textValue: null,
      booleanValue: classifiedValue.value,
      textArrayValue: null,
    };
  }

  return {
    valueType: classifiedValue.valueType,
    numberValue: null,
    textValue: null,
    booleanValue: null,
    textArrayValue: classifiedValue.value,
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

async function loadDossierMetricRevisionRows(numeroDossier: number) {
  const db = getDb();
  const sourceRevisions = db
    .select(currentMetricSelection)
    .from(dossierMetricRevisions)
    .where(
      and(
        eq(dossierMetricRevisions.dossierNumber, numeroDossier),
        eq(dossierMetricRevisions.revision, 1),
      ),
    );
  const latestRevisions = db
    .selectDistinctOn(
      [dossierMetricRevisions.dossierNumber, dossierMetricRevisions.metricCode],
      currentMetricSelection,
    )
    .from(dossierMetricRevisions)
    .where(eq(dossierMetricRevisions.dossierNumber, numeroDossier))
    .orderBy(
      asc(dossierMetricRevisions.dossierNumber),
      asc(dossierMetricRevisions.metricCode),
      desc(dossierMetricRevisions.revision),
    );
  const revisions = await unionAll(sourceRevisions, latestRevisions);
  const revisionsByMetricCode = Object.groupBy(
    revisions,
    (revision) => revision.metricCode,
  );
  const sources: CurrentMetricRow[] = [];
  const effectiveRevisions: CurrentMetricRow[] = [];

  for (const metricRevisions of Object.values(revisionsByMetricCode)) {
    const source = metricRevisions?.find((revision) => revision.revision === 1);
    const effectiveRevision = metricRevisions?.reduce((latest, revision) =>
      revision.revision > latest.revision ? revision : latest,
    );

    if (source && effectiveRevision) {
      sources.push(source);
      effectiveRevisions.push(effectiveRevision);
    }
  }

  return { sources, effectiveRevisions };
}

function revisionRowsToTargets({
  sources,
  effectiveRevisions,
}: Awaited<ReturnType<typeof loadDossierMetricRevisionRows>>) {
  const sourcesByMetricCode = new Map(
    sources.map((source) => [source.metricCode, source]),
  );

  return Object.fromEntries(
    effectiveRevisions.flatMap((effectiveRevision) => {
      const source = sourcesByMetricCode.get(effectiveRevision.metricCode);
      return source
        ? [
            [
              effectiveRevision.metricCode,
              revisionRowsToTarget({ source, effectiveRevision }),
            ],
          ]
        : [];
    }),
  );
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

export async function resetDossierMetrics({
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

  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${numeroDossier})`);
    await tx
      .delete(dossierMetricRevisions)
      .where(eq(dossierMetricRevisions.dossierNumber, numeroDossier));

    if (revisions.length > 0) {
      await tx.insert(dossierMetricRevisions).values(revisions);
    }
  });
}

export async function getDossierMetricsState({
  numeroDossier,
}: {
  numeroDossier: number;
}): Promise<DossierMetricsState> {
  const snapshot = await getDossierMetricsSnapshot({ numeroDossier });

  if (snapshot.status === "not-imported") {
    return { status: "not-imported" };
  }

  return {
    status: "imported",
    metrics: snapshot.metrics,
  };
}

export async function getDossierMetricRevisionTargets({
  numeroDossier,
}: {
  numeroDossier: number;
}): Promise<Record<string, DossierMetricRevisionTarget>> {
  return revisionRowsToTargets(
    await loadDossierMetricRevisionRows(numeroDossier),
  );
}

export async function getDossierMetricsSnapshot({
  numeroDossier,
}: {
  numeroDossier: number;
}): Promise<DossierMetricsSnapshot> {
  const rows = await loadDossierMetricRevisionRows(numeroDossier);
  const targets = revisionRowsToTargets(rows);

  if (rows.effectiveRevisions.length === 0) {
    return { status: "not-imported", targets };
  }

  return {
    status: "imported",
    metrics: rowsToMetrics(rows.effectiveRevisions),
    targets,
  };
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

    const revisions = await unionAll(
      tx
        .select(currentMetricSelection)
        .from(dossierMetricRevisions)
        .where(
          and(
            eq(dossierMetricRevisions.dossierNumber, numeroDossier),
            eq(dossierMetricRevisions.metricCode, metricCode),
            eq(dossierMetricRevisions.revision, 1),
          ),
        )
        .limit(1),
      tx
        .select(currentMetricSelection)
        .from(dossierMetricRevisions)
        .where(
          and(
            eq(dossierMetricRevisions.dossierNumber, numeroDossier),
            eq(dossierMetricRevisions.metricCode, metricCode),
          ),
        )
        .orderBy(desc(dossierMetricRevisions.revision))
        .limit(1),
    );
    const source = revisions.find((revision) => revision.revision === 1);
    const effectiveRevision = revisions.reduce<CurrentMetricRow | undefined>(
      (latest, revision) =>
        !latest || revision.revision > latest.revision ? revision : latest,
      undefined,
    );

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

    const validation = normalizeMetricValue(target.valueType, value);
    if (!validation.success) {
      throw new DossierMetricRevisionError(
        "invalid-value",
        "Valeur invalide pour le type de la métrique",
      );
    }
    const normalizedValue = validation.value;

    if (metricValuesEqual(target.effectiveValue, normalizedValue)) {
      return target;
    }

    const revision = target.revision + 1;

    await tx.insert(dossierMetricRevisions).values({
      dossierNumber: numeroDossier,
      metricCode,
      revision,
      label: target.label,
      unit: target.unit,
      ...valueColumns(normalizedValue),
    });

    return {
      ...target,
      revision,
      effectiveValue: normalizedValue,
    };
  });
}
