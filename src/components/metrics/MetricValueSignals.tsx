import Badge from "@codegouvfr/react-dsfr/Badge";

import { anomalyCategoryLabels } from "@/components/metrics/FondsVertAnomalyStatus";
import type { NormalizedMetricAnomaly } from "@/utils/metrics/anomalies";

// Summarizes every Fonds vert signal attached to one displayed value: the most
// severe category once, then the source values to check for a signaled ratio.
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
  const sourcesLabels = [
    ...new Set(anomalies.flatMap((anomaly) => anomaly.sourcesLabel ?? [])),
  ];

  return (
    <div aria-label="Anomalie détectée" role="note" className="space-y-1">
      <Badge
        small
        severity={category === "strong-inconsistency" ? "error" : "warning"}
      >
        {anomalyCategoryLabels[category]}
      </Badge>
      {sourcesLabels.map((sourcesLabel) => (
        <p key={sourcesLabel} className="mb-0 text-sm">
          À vérifier avec les {sourcesLabel}.
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
