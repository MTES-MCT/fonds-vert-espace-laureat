import Badge from "@codegouvfr/react-dsfr/Badge";

import { anomalyCategoryLabels } from "@/components/metrics/FondsVertAnomalyStatus";
import type { NormalizedMetricAnomaly } from "@/utils/metrics/anomalies";

// Summarizes every Fonds vert signal attached to one displayed value: the most
// severe category once, then only the ratios that point at this value.
export function MetricValueSignals({
  anomalies,
  corrected,
}: {
  anomalies: NormalizedMetricAnomaly[];
  corrected: boolean;
}) {
  const category = anomalies.some(
    (anomaly) => anomaly.severity === "strong-inconsistency",
  )
    ? "strong-inconsistency"
    : "statistical";
  const ratios = anomalies.filter((anomaly) => anomaly.metricCodes.length > 1);

  return (
    <div aria-label="Anomalie détectée" role="note" className="space-y-1">
      <Badge
        small
        severity={category === "strong-inconsistency" ? "error" : "warning"}
      >
        {anomalyCategoryLabels[category]}
      </Badge>
      {ratios.map((ratio) => (
        <p key={ratio.id} className="mb-0 text-sm">
          Via le ratio : {ratio.label}
        </p>
      ))}
      {corrected && (
        <p className="mb-0 text-sm text-[var(--text-mention-grey)]">
          Corrigée, en attente de la prochaine analyse Fonds vert.
        </p>
      )}
    </div>
  );
}
