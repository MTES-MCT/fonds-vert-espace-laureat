import { Metrics } from "@/services/fondsvert/dossier";
import { formatMetric } from "@/utils/format";

export function MetricsGrid({ metriques }: { metriques?: Metrics }) {
  if (!metriques) return null;

  const metricEntries = Object.entries(metriques).filter(
    ([, metricValue]) => metricValue.valeur_estimee !== null,
  );

  if (metricEntries.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {metricEntries.map(([key, metricValue]) => (
        <div
          key={key}
          className="relative bg-white p-4 shadow border-t-4 border-t-green-500 rounded-sm overflow-hidden"
          data-testid={`metric-grid-${key}`}
        >
          <div className="text-sm text-gray-600 font-medium mb-2">
            {metricValue.label}
          </div>
          {metricValue.valeur_estimee !== null && (
            <div
              className="text-2xl font-semibold text-gray-800"
              data-testid={`metric-grid-${key}-value-display`}
            >
              {formatMetric(metricValue.valeur_estimee)}
              <span className="text-base font-normal">
                {metricValue.unite && ` ${metricValue.unite}`}
              </span>
            </div>
          )}
          {metricValue.valeur_reelle !== null && (
            <div
              className="text-sm font-medium text-gray-900 mt-1"
              data-testid={`metric-grid-${key}-real-value-display`}
            >
              Valeur réelle : {formatMetric(metricValue.valeur_reelle)}
              <span className="text-sm font-normal">
                {metricValue.unite && ` ${metricValue.unite}`}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
