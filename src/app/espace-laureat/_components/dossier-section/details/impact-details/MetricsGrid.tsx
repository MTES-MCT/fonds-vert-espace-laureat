import { ArrowedValues } from "@/components/metrics/ArrowedValues";
import { Metrics, ProcessedMetric } from "@/services/fondsvert/dossier";
import { formatMetric } from "@/utils/format";
import { processMetrics } from "@/utils/metrics";

function labelToTestId(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
    .replace(/[^a-z0-9]+/g, "-") // Remplacer les caractères non alphanumériques par des tirets
    .replace(/^-+|-+$/g, ""); // Enlever les tirets au début et à la fin
}

const SimpleMetricCard = ({
  metricKey,
  metric,
}: {
  metricKey: string;
  metric: ProcessedMetric;
}) => {
  if (metric._typename !== "Simple") return null;

  const metricId = labelToTestId(metric.label);
  const hasEstimee = metric.valeur_estimee !== null;
  const hasReelle = metric.valeur_reelle !== null;
  const hasBothValues = hasEstimee && hasReelle;

  return (
    <div
      key={metricKey}
      className="relative bg-white p-4 shadow border-t-4 border-t-green-500 rounded-sm overflow-hidden"
      data-testid={`metric-${metricId}`}
    >
      <div className="text-sm text-gray-600 font-medium mb-2">
        {metric.label}
      </div>

      {hasBothValues ? (
        <ArrowedValues
          values={[metric.valeur_estimee, metric.valeur_reelle]}
          labels={["Valeur estimée", "Valeur réelle"]}
          unite={metric.unite}
        />
      ) : (
        <>
          {hasEstimee && (
            <div className="flex flex-col">
              <div className="text-xs text-gray-500">Valeur estimée</div>
              <div
                className="text-lg font-semibold"
                data-testid="valeur-estimee"
              >
                {formatMetric(metric.valeur_estimee)}
                {metric.unite && (
                  <span className="text-sm font-normal ml-1">
                    {metric.unite}
                  </span>
                )}
              </div>
            </div>
          )}

          {hasReelle && (
            <div className="flex flex-col mt-2">
              <div className="text-xs text-gray-500">Valeur réelle</div>
              <div
                className="text-lg font-semibold"
                data-testid="valeur-reelle"
              >
                {formatMetric(metric.valeur_reelle)}
                {metric.unite && (
                  <span className="text-sm font-normal ml-1">
                    {metric.unite}
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const AvantApresTravauxCard = ({
  metricKey,
  metric,
}: {
  metricKey: string;
  metric: ProcessedMetric;
}) => {
  if (metric._typename !== "AvantApresTravaux") return null;

  const metricId = labelToTestId(metric.label);

  return (
    <div
      key={metricKey}
      className="relative bg-white p-4 shadow border-t-4 border-t-green-500 rounded-sm overflow-hidden"
      data-testid={`metric-${metricId}`}
    >
      <div className="text-sm text-gray-600 font-medium mb-3">
        {metric.label}
      </div>

      <ArrowedValues
        values={[
          metric.valeur_avant_travaux,
          metric.valeur_apres_travaux_estimee,
          metric.valeur_apres_travaux_reelle,
        ]}
        labels={[
          "Avant travaux",
          "Après travaux (estimée)",
          "Après travaux (réelle)",
        ]}
        unite={metric.unite}
      />
    </div>
  );
};

export function MetricsGrid({ metriques }: { metriques?: Metrics }) {
  if (!metriques) return null;

  const processedMetrics = processMetrics(metriques);
  const metricEntries = Object.entries(processedMetrics);

  if (metricEntries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4">
      {metricEntries.map(([key, metric]) =>
        metric._typename === "Simple" ? (
          <SimpleMetricCard key={key} metricKey={key} metric={metric} />
        ) : (
          <AvantApresTravauxCard key={key} metricKey={key} metric={metric} />
        ),
      )}
    </div>
  );
}
