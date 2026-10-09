import type { dossierMetricRevisions } from "@/db/schema";
import type { MetricValue } from "@/services/fondsvert/dossier";

type MetricValueRow = Pick<
  typeof dossierMetricRevisions.$inferSelect,
  "valueType" | "numberValue" | "textValue" | "booleanValue" | "textArrayValue"
>;

/** Decodes a revision whose value columns satisfy the database constraint. */
export function metricRevisionValue(row: MetricValueRow): MetricValue {
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
