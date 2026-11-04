import Badge from "@codegouvfr/react-dsfr/Badge";

import { FondsVertCategoryBadge } from "@/components/metrics/FondsVertAnomalyStatus";
import type { NormalizedMetricAnomaly } from "@/utils/metrics/anomalies";

// Summarizes every Fonds vert signal attached to one displayed value in one
// badge. Once the value is corrected, only its pending re-analysis is shown.
export function MetricValueSignals({
  anomalies,
  corrected,
}: {
  anomalies: NormalizedMetricAnomaly[];
  corrected: boolean;
}) {
  if (corrected) {
    return (
      <div aria-label="Anomalie détectée" role="note">
        <Badge className="whitespace-nowrap" small severity="info">
          En attente d’analyse
        </Badge>
      </div>
    );
  }

  const category = anomalies.some(
    (anomaly) => anomaly.severity === "strong-inconsistency",
  )
    ? "strong-inconsistency"
    : "statistical";

  return (
    <div aria-label="Anomalie détectée" role="note">
      <FondsVertCategoryBadge category={category} />
    </div>
  );
}
