"use client";

import { ArrowedValues } from "@/components/metrics/ArrowedValues";
import { MetricCorrectionEditor } from "@/components/metrics/MetricCorrectionEditor";
import { useMetricRevisions } from "@/components/metrics/MetricRevisionContext";
import { MetricValue } from "@/components/metrics/MetricValue";
import type { Metrics, ProcessedMetric } from "@/services/fondsvert/dossier";
import { isMetricFields } from "@/utils/metrics/guards";
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
  metric,
  borderColorClass = "border-t-green-500",
}: {
  metric: Extract<ProcessedMetric, { _typename: "Simple" }>;
  borderColorClass?: string;
}) => {
  const metricId = labelToTestId(metric.label);
  const estimee = metric.valeur_estimee ?? undefined;
  const { targets } = useMetricRevisions();
  const target = targets[metric.metricCode];

  return (
    <section
      aria-label={metric.label}
      className={`space-y-2 border-t-4 bg-white p-4 shadow-md ${borderColorClass}
        overflow-hidden rounded-xs
      `}
      data-testid={`metric-${metricId}`}
    >
      <h5 className="max-w-[18rem] text-sm font-medium text-balance text-gray-600">
        {metric.label}
      </h5>

      {estimee !== undefined && (
        <MetricValue
          value={estimee}
          accessibleName="Valeur effective"
          unite={metric.unite}
          testId="valeur-estimee"
        />
      )}
      {target && <MetricCorrectionEditor target={target} />}
    </section>
  );
};

const AvantApresTravauxCard = ({
  metric,
  borderColorClass = "border-t-green-500",
}: {
  metric: Extract<ProcessedMetric, { _typename: "AvantApresTravaux" }>;
  borderColorClass?: string;
}) => {
  const metricId = labelToTestId(metric.label);
  const { targets } = useMetricRevisions();
  const beforeTarget = targets[metric.beforeMetricCode];
  const afterTarget = targets[metric.afterMetricCode];

  return (
    <section
      aria-label={metric.label}
      className={`relative space-y-4 border-t-4 bg-white p-4 shadow-md ${borderColorClass}
        overflow-hidden rounded-xs
      `}
      data-testid={`metric-${metricId}`}
    >
      <div className="text-sm font-medium text-gray-600">{metric.label}</div>

      <ArrowedValues
        values={[metric.valeur_avant_travaux, metric.valeur_apres_travaux]}
        labels={["Avant travaux", "Après travaux"]}
        unite={metric.unite}
      />
      <div className="flex flex-wrap gap-2">
        {beforeTarget && (
          <MetricCorrectionEditor
            target={beforeTarget}
            buttonLabel="Modifier la valeur avant travaux"
          />
        )}
        {afterTarget && (
          <MetricCorrectionEditor
            target={afterTarget}
            buttonLabel="Modifier la valeur après travaux"
          />
        )}
      </div>
    </section>
  );
};

export function MetricsGrid({ metriques }: { metriques?: Metrics }) {
  const { targets } = useMetricRevisions();
  if (!metriques) return null;

  const effectiveMetrics = Object.fromEntries(
    Object.entries(metriques).map(([metricCode, metric]) => {
      const target = targets[metricCode];

      return [
        metricCode,
        target && isMetricFields(metric)
          ? { ...metric, valeur_estimee: target.effectiveValue }
          : metric,
      ];
    }),
  );
  const processedMetrics = processMetrics(effectiveMetrics);
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
              className="mb-4 text-lg font-medium"
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
                  metric={metric}
                  borderColorClass={borderColorClass}
                />
              ) : (
                <AvantApresTravauxCard
                  key={key}
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
