import { and, asc, desc, gt, inArray, notInArray } from "drizzle-orm";

import { type DbTransaction, getDb } from "@/db";
import { metricRevisionValue } from "@/db/dossierMetricValue";
import { dossierMetricRevisions } from "@/db/schema";
import { type MetricValue } from "@/services/fondsvert/dossier";
import {
  DEMO_DOSSIER_NUMBERS,
  LEGACY_DEMO_NUMBER,
} from "@/utils/demo/reservation";

type MetricRevisionRow = typeof dossierMetricRevisions.$inferSelect;
export type FondsVertMetricValueType = MetricRevisionRow["valueType"];

export type FondsVertCorrection = {
  dossierNumber: number;
  metricCode: string;
  revision: number;
  valueType: FondsVertMetricValueType;
  value: MetricValue;
  unit: string | null;
  correctedAt: Date;
};

const correctionSelection = {
  dossierNumber: dossierMetricRevisions.dossierNumber,
  metricCode: dossierMetricRevisions.metricCode,
  revision: dossierMetricRevisions.revision,
  unit: dossierMetricRevisions.unit,
  valueType: dossierMetricRevisions.valueType,
  numberValue: dossierMetricRevisions.numberValue,
  textValue: dossierMetricRevisions.textValue,
  booleanValue: dossierMetricRevisions.booleanValue,
  textArrayValue: dossierMetricRevisions.textArrayValue,
  createdAt: dossierMetricRevisions.createdAt,
};

/**
 * Reads the current local correction for each dossier/metric pair in scope.
 */
export async function getLatestFondsVertCorrections(
  demo = false,
  transaction?: DbTransaction,
): Promise<FondsVertCorrection[]> {
  const rows = await (transaction ?? getDb())
    .selectDistinctOn(
      [dossierMetricRevisions.dossierNumber, dossierMetricRevisions.metricCode],
      correctionSelection,
    )
    .from(dossierMetricRevisions)
    .where(
      and(
        gt(dossierMetricRevisions.revision, 1),
        demo
          ? inArray(dossierMetricRevisions.dossierNumber, [
              ...DEMO_DOSSIER_NUMBERS,
            ])
          : notInArray(dossierMetricRevisions.dossierNumber, [
              ...DEMO_DOSSIER_NUMBERS,
              LEGACY_DEMO_NUMBER,
            ]),
      ),
    )
    .orderBy(
      asc(dossierMetricRevisions.dossierNumber),
      asc(dossierMetricRevisions.metricCode),
      desc(dossierMetricRevisions.revision),
    );

  return rows.map((row) => ({
    dossierNumber: row.dossierNumber,
    metricCode: row.metricCode,
    revision: row.revision,
    valueType: row.valueType,
    value: metricRevisionValue(row),
    unit: row.unit,
    correctedAt: row.createdAt,
  }));
}
