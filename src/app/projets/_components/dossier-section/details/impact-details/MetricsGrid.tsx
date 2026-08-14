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

type MetricsGridProps = {
  metriques?: Metrics;
  visibleMetricCodes?: ReadonlySet<string>;
  onCorrectionSuccess?: (metricLabel: string) => void;
};

function isMetricVisible(
  metric: ProcessedMetric,
  visibleMetricCodes?: ReadonlySet<string>,
): boolean {
  if (!visibleMetricCodes) return true;

  return metric._typename === "Simple"
    ? visibleMetricCodes.has(metric.metricCode)
    : visibleMetricCodes.has(metric.beforeMetricCode) ||
        visibleMetricCodes.has(metric.afterMetricCode);
}

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

const MetricCard = ({ children }: { children: ReactNode }) => (
  <div
    className={`
      relative grid grid-cols-1 items-start gap-x-6 bg-[var(--background-alt-grey)] p-4
      sm:grid-cols-[minmax(0,1fr)_auto]
    `}
  >
    {children}
  </div>
);

const SimpleMetricRow = ({
  metric,
  onCorrectionSuccess,
}: {
  metric: Extract<ProcessedMetric, { _typename: "Simple" }>;
  onCorrectionSuccess?: (metricLabel: string) => void;
}) => {
  const metricId = labelToTestId(metric.label);
  const estimee = metric.valeur_estimee ?? undefined;
  const { targets } = useMetricRevisions();
  const anomaliesByMetricCode = useMetricAnomaliesByMetricCode();
  const target = targets[metric.metricCode];
  const anomalies = anomaliesByMetricCode[metric.metricCode];

  return (
    <section aria-label={metric.label} data-testid={`metric-${metricId}`}>
      <MetricCard>
        <div className="pr-24 sm:pr-0">
          <dl className="space-y-1">
            <dt className="text-[var(--text-label-grey)]">{metric.label}</dt>
            {estimee !== undefined && (
              <dd className="!mb-0">
                <MetricValue
                  value={estimee}
                  accessibleName="Valeur effective"
                  unite={metric.unite}
                  testId="valeur-estimee"
                />
              </dd>
            )}
          </dl>
        </div>
        {target && (
          <div className="absolute top-4 right-4 sm:static sm:justify-self-end">
            <MetricCorrectionEditor
              target={target}
              buttonLabel="Modifier"
              successFeedback={onCorrectionSuccess ? "parent" : "editor"}
              onSuccess={() => onCorrectionSuccess?.(target.label)}
            />
          </div>
        )}
        {anomalies?.length ? (
          <div className="col-span-full mt-3 space-y-3">
            <MetricAnomalyNotices anomalies={anomalies} />
          </div>
        ) : null}
      </MetricCard>
    </section>
  );
};

const AvantApresTravauxRows = ({
  metric,
  relatedMetric,
  visibleMetricCodes,
  onCorrectionSuccess,
}: {
  metric: Extract<ProcessedMetric, { _typename: "AvantApresTravaux" }>;
  relatedMetric?: Extract<ProcessedMetric, { _typename: "Simple" }>;
  visibleMetricCodes?: ReadonlySet<string>;
  onCorrectionSuccess?: (metricLabel: string) => void;
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
  ].filter(
    ({ metricCode }) =>
      !visibleMetricCodes || visibleMetricCodes.has(metricCode),
  );

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
            <MetricCard>
              <div className="pr-24 sm:pr-0">
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
                    successFeedback={onCorrectionSuccess ? "parent" : "editor"}
                    onSuccess={() => onCorrectionSuccess?.(target.label)}
                  />
                </div>
              )}
              {anomaliesByMetricCode[metricCode]?.length ? (
                <div className="col-span-full mt-3 space-y-3">
                  <MetricAnomalyNotices
                    anomalies={anomaliesByMetricCode[metricCode]}
                  />
                </div>
              ) : null}
            </MetricCard>
          </div>
        ))}
      </dl>
    </section>
  );
};

export function MetricsGrid({
  metriques,
  visibleMetricCodes,
  onCorrectionSuccess,
}: MetricsGridProps) {
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
  const metricGroups = Object.fromEntries(
    Object.entries(groupMetricsByTheme(processedMetrics)).filter(([, group]) =>
      Object.values(group.metrics).some((metric) =>
        isMetricVisible(metric, visibleMetricCodes),
      ),
    ),
  );

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
              className="mb-4 flex items-center gap-2 text-lg font-medium"
              data-testid={`metric-group-title-${groupId}`}
            >
              <span
                aria-hidden="true"
                className={`${group.theme.iconClass} ${group.theme.accentTextColor}`}
              />
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
                if (!isMetricVisible(metric, visibleMetricCodes)) return null;

                return (
                  <SimpleMetricRow
                    key={key}
                    metric={metric}
                    onCorrectionSuccess={onCorrectionSuccess}
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

              if (
                !isMetricVisible(metric, visibleMetricCodes) &&
                (!relatedMetric ||
                  !isMetricVisible(relatedMetric, visibleMetricCodes))
              ) {
                return null;
              }

              return (
                <AvantApresTravauxRows
                  key={key}
                  metric={metric}
                  relatedMetric={relatedMetric}
                  visibleMetricCodes={visibleMetricCodes}
                  onCorrectionSuccess={onCorrectionSuccess}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
