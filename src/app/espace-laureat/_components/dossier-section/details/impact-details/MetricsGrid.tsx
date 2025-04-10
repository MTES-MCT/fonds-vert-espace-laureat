import { ArrowedValues } from "@/components/metrics/ArrowedValues";
import { MetricValue } from "@/components/metrics/MetricValue";
import { Metrics, ProcessedMetric } from "@/services/fondsvert/dossier";
import { processMetrics } from "@/utils/metrics/process";
import { groupMetricsByTheme } from "@/utils/metrics/themes";

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
  borderColorClass = "border-t-green-500",
}: {
  metricKey: string;
  metric: ProcessedMetric;
  borderColorClass?: string;
}) => {
  if (metric._typename !== "Simple") return null;

  const metricId = labelToTestId(metric.label);
  const hasEstimee = metric.valeur_estimee !== null;
  const hasReelle = metric.valeur_reelle !== null;
  const hasBothValues = hasEstimee && hasReelle;

  return (
    <div
      key={metricKey}
      className={`bg-white p-4 shadow-md border-t-4 ${borderColorClass} rounded-xs overflow-hidden`}
      data-testid={`metric-${metricId}`}
    >
      <h5 className="text-sm text-gray-600 font-medium mb-2 text-balance max-w-[18rem]">
        {metric.label}
      </h5>

      {hasBothValues ? (
        <ArrowedValues
          values={[metric.valeur_estimee, metric.valeur_reelle]}
          labels={["Valeur estimée", "Valeur réelle"]}
          unite={metric.unite}
        />
      ) : (
        <>
          {hasEstimee && (
            <MetricValue
              value={metric.valeur_estimee}
              label="Valeur estimée"
              unite={metric.unite}
              testId="valeur-estimee"
            />
          )}

          {hasReelle && (
            <div className="mt-2">
              <MetricValue
                value={metric.valeur_reelle}
                label="Valeur réelle"
                unite={metric.unite}
                testId="valeur-reelle"
              />
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
  borderColorClass = "border-t-green-500",
}: {
  metricKey: string;
  metric: ProcessedMetric;
  borderColorClass?: string;
}) => {
  if (metric._typename !== "AvantApresTravaux") return null;

  const metricId = labelToTestId(metric.label);

  return (
    <div
      key={metricKey}
      className={`relative bg-white p-4 shadow-md border-t-4 ${borderColorClass} rounded-xs overflow-hidden`}
      data-testid={`metric-${metricId}`}
    >
      <div className="text-sm text-gray-600 font-medium mb-2">
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
  const metricGroups = groupMetricsByTheme(processedMetrics);

  if (Object.keys(metricGroups).length === 0) return null;

  return (
    <div className="space-y-8">
      {Object.entries(metricGroups).map(([groupId, group]) => (
        <div
          key={groupId}
          className="metric-group"
          data-testid={`metric-group-${groupId}`}
        >
          {group.theme && (
            <h4
              className="text-lg font-medium mb-4"
              data-testid={`metric-group-title-${groupId}`}
            >
              {group.theme.label}
            </h4>
          )}
          <div className="flex flex-wrap gap-4">
            {Object.entries(group.metrics).map(([key, metric]) => {
              const borderColorClass =
                group.theme?.borderColor || "border-t-green-500";

              return metric._typename === "Simple" ? (
                <SimpleMetricCard
                  key={key}
                  metricKey={key}
                  metric={metric}
                  borderColorClass={borderColorClass}
                />
              ) : (
                <AvantApresTravauxCard
                  key={key}
                  metricKey={key}
                  metric={metric}
                  borderColorClass={borderColorClass}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
