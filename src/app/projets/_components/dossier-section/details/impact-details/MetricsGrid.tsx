"use client";

import type { ReactNode } from "react";

import {
  type MetricAnomaly,
  useMetricAnomaliesByMetricCode,
} from "@/components/metrics/MetricAnomalyContext";
import { MetricAnomalyMessage } from "@/components/metrics/MetricAnomalyMessage";
import { MetricCorrectionEditor } from "@/components/metrics/MetricCorrectionEditor";
import { useMetricRevisions } from "@/components/metrics/MetricRevisionContext";
import { MetricValue } from "@/components/metrics/MetricValue";
import type { Metrics, ProcessedMetric } from "@/services/fondsvert/dossier";
import { isMetricFields } from "@/utils/metrics/guards";
import { processMetrics } from "@/utils/metrics/process";
import { groupMetricsByTheme } from "@/utils/metrics/themes";

const RELATED_METRIC_LABELS: Record<string, string> = {
  "Consommation énergétique": "Gain énergétique estimé",
  "Émissions de GES": "Émissions de GES évitées",
};

function labelToTestId(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
    .replace(/[^a-z0-9]+/g, "-") // Remplacer les caractères non alphanumériques par des tirets
    .replace(/^-+|-+$/g, ""); // Enlever les tirets au début et à la fin
}

const MetricAnomalyNotices = ({ anomalies }: { anomalies?: MetricAnomaly[] }) =>
  anomalies?.map((anomaly) => (
    <div
      key={`${anomaly.metricCode}-${anomaly.problem.label}`}
      aria-label="Anomalie détectée"
      role="note"
    >
      <MetricAnomalyMessage
        problem={anomaly.problem}
        helpText={anomaly.helpText}
      />
    </div>
  ));

const MetricCard = ({
  accentBorderColor,
  children,
}: {
  accentBorderColor: string;
  children: ReactNode;
}) => (
  <div
    className={`
      relative grid grid-cols-1 items-start gap-x-6 border-l-4 bg-[var(--background-alt-grey)] p-4
      sm:grid-cols-[minmax(0,1fr)_auto]
      ${accentBorderColor}
    `}
  >
    {children}
  </div>
);

const SimpleMetricRow = ({
  accentBorderColor,
  metric,
}: {
  accentBorderColor: string;
  metric: Extract<ProcessedMetric, { _typename: "Simple" }>;
}) => {
  const metricId = labelToTestId(metric.label);
  const estimee = metric.valeur_estimee ?? undefined;
  const { targets } = useMetricRevisions();
  const anomaliesByMetricCode = useMetricAnomaliesByMetricCode();
  const target = targets[metric.metricCode];
  const anomalies = anomaliesByMetricCode[metric.metricCode];

  return (
    <section aria-label={metric.label} data-testid={`metric-${metricId}`}>
      <MetricCard accentBorderColor={accentBorderColor}>
        <div
          className={`space-y-3 ${
            anomalies?.length ? "pt-12 sm:pt-0" : "pr-24 sm:pr-0"
          }`}
        >
          <MetricAnomalyNotices anomalies={anomalies} />
          <div className="space-y-1">
            <h5 className="mb-0 text-base font-normal text-[var(--text-label-grey)]">
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
          </div>
        </div>
        {target && (
          <div className="absolute top-4 right-4 sm:static sm:justify-self-end">
            <MetricCorrectionEditor target={target} buttonLabel="Modifier" />
          </div>
        )}
      </MetricCard>
    </section>
  );
};

const AvantApresTravauxRows = ({
  accentBorderColor,
  metric,
  relatedMetric,
}: {
  accentBorderColor: string;
  metric: Extract<ProcessedMetric, { _typename: "AvantApresTravaux" }>;
  relatedMetric?: Extract<ProcessedMetric, { _typename: "Simple" }>;
}) => {
  const metricId = labelToTestId(metric.label);
  const { targets } = useMetricRevisions();
  const anomaliesByMetricCode = useMetricAnomaliesByMetricCode();
  const beforeTarget = targets[metric.beforeMetricCode];
  const afterTarget = targets[metric.afterMetricCode];
  const relatedTarget = relatedMetric
    ? targets[relatedMetric.metricCode]
    : undefined;
  const rows = [
    {
      label: "Avant travaux",
      value: metric.valeur_avant_travaux,
      metricCode: metric.beforeMetricCode,
      target: beforeTarget,
      testId: "valeur-0",
    },
    {
      label: "Après travaux",
      value: metric.valeur_apres_travaux,
      metricCode: metric.afterMetricCode,
      target: afterTarget,
      testId: "valeur-1",
    },
    ...(relatedMetric
      ? [
          {
            label: relatedMetric.label,
            value: relatedMetric.valeur_estimee,
            metricCode: relatedMetric.metricCode,
            target: relatedTarget,
            testId: "valeur-estimee",
          },
        ]
      : []),
  ];

  return (
    <section aria-label={metric.label} data-testid={`metric-${metricId}`}>
      <h5 className="mb-4 text-base font-normal text-[var(--text-label-grey)]">
        {metric.label}
      </h5>
      <dl className="space-y-3">
        {rows.map(({ label, value, metricCode, target, testId }) => (
          <div
            key={label}
            aria-label={label}
            data-testid={
              relatedMetric?.label === label
                ? `metric-${labelToTestId(label)}`
                : undefined
            }
            role="group"
          >
            <MetricCard accentBorderColor={accentBorderColor}>
              <div
                className={`space-y-3 ${
                  anomaliesByMetricCode[metricCode]?.length
                    ? "pt-12 sm:pt-0"
                    : "pr-24 sm:pr-0"
                }`}
              >
                <MetricAnomalyNotices
                  anomalies={anomaliesByMetricCode[metricCode]}
                />
                <div className="space-y-1">
                  <dt className="text-[var(--text-label-grey)]">{label}</dt>
                  <dd className="!mb-0">
                    <MetricValue
                      value={value}
                      accessibleName={label}
                      unite={
                        relatedMetric?.label === label
                          ? relatedMetric.unite
                          : metric.unite
                      }
                      testId={testId}
                    />
                  </dd>
                </div>
              </div>
              {target && (
                <div className="absolute top-4 right-4 sm:static sm:justify-self-end">
                  <MetricCorrectionEditor
                    target={target}
                    buttonLabel="Modifier"
                  />
                </div>
              )}
            </MetricCard>
          </div>
        ))}
      </dl>
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
          <div className="space-y-4">
            {Object.entries(group.metrics).map(([key, metric]) => {
              const hasRelatedParent =
                metric._typename === "Simple" &&
                Object.entries(RELATED_METRIC_LABELS).some(
                  ([parentLabel, relatedLabel]) =>
                    relatedLabel === metric.label &&
                    Object.values(group.metrics).some(
                      (candidate) =>
                        candidate._typename === "AvantApresTravaux" &&
                        candidate.label === parentLabel,
                    ),
                );

              if (hasRelatedParent) {
                return null;
              }

              if (metric._typename === "Simple") {
                return (
                  <SimpleMetricRow
                    key={key}
                    accentBorderColor={
                      group.theme?.accentBorderColor || "border-l-green-500"
                    }
                    metric={metric}
                  />
                );
              }

              const relatedMetricLabel = RELATED_METRIC_LABELS[metric.label];
              const relatedMetric = Object.values(group.metrics).find(
                (
                  candidate,
                ): candidate is Extract<
                  ProcessedMetric,
                  { _typename: "Simple" }
                > =>
                  candidate._typename === "Simple" &&
                  candidate.label === relatedMetricLabel,
              );

              return (
                <AvantApresTravauxRows
                  key={key}
                  accentBorderColor={
                    group.theme?.accentBorderColor || "border-l-green-500"
                  }
                  metric={metric}
                  relatedMetric={relatedMetric}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
