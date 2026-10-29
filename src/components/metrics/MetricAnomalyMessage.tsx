import Badge from "@codegouvfr/react-dsfr/Badge";

import { anomalyCategoryLabels } from "@/components/metrics/FondsVertAnomalyStatus";
import type { NormalizedMetricAnomaly } from "@/utils/metrics/anomalies";

export function MetricAnomalyMessage({
  anomaly,
}: {
  anomaly: NormalizedMetricAnomaly;
}) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2">
        {anomaly.categories.map((category) => (
          <Badge
            key={category}
            small
            severity={category === "strong-inconsistency" ? "error" : "warning"}
          >
            {anomalyCategoryLabels[category]}
          </Badge>
        ))}
      </div>
      <p className="mb-0 text-sm">{anomaly.label}</p>
    </div>
  );
}
