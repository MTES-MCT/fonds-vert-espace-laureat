import { FondsVertCategoryBadge } from "@/components/metrics/FondsVertAnomalyStatus";
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
          <FondsVertCategoryBadge key={category} category={category} />
        ))}
      </div>
      <p className="mb-0 text-sm">{anomaly.label}</p>
    </div>
  );
}
