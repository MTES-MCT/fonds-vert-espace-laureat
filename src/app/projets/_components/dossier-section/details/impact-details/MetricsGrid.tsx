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
import { slugify } from "@/utils/format";
import { isMetricFields } from "@/utils/metrics/guards";
import { processMetrics } from "@/utils/metrics/process";
import { groupMetricsByTheme } from "@/utils/metrics/themes";

const RELATED_METRIC_LABELS: Record<string, string> = {
  "Consommation énergétique": "Gain énergétique estimé",
  "Émissions de GES": "Émissions de GES évitées",
};

const PAIRED_METRIC_CODES: Record<string, string> = {
  nature_operations: "type_batiment",
  surface_batiment_m2_avant_projet: "type_surface",
  nombre_habitant_gestion_proximite: "tonnage_annuel_entrant_gestion_proximite",
  nombre_habitant_collecte_separee:
    "quantite_globale_annuel_biodechets_collectes",
};

type MetricsGridProps = {
  metriques?: Metrics;
  visibleMetricCodes?: ReadonlySet<string>;
};

type SimpleMetric = Extract<ProcessedMetric, { _typename: "Simple" }>;

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

function indexRelatedMetrics(metrics: Record<string, ProcessedMetric>) {
  const simpleMetricsByLabel = new Map<string, SimpleMetric>();

  for (const metric of Object.values(metrics)) {
    if (metric._typename === "Simple") {
      simpleMetricsByLabel.set(metric.label, metric);
    }
  }

  const relatedMetricsByParentLabel = new Map<string, SimpleMetric>();
  const relatedMetricCodes = new Set<string>();

  for (const metric of Object.values(metrics)) {
    if (metric._typename !== "AvantApresTravaux") continue;

    const relatedMetric = simpleMetricsByLabel.get(
      RELATED_METRIC_LABELS[metric.label],
    );

    if (relatedMetric) {
      relatedMetricsByParentLabel.set(metric.label, relatedMetric);
      relatedMetricCodes.add(relatedMetric.metricCode);
    }
  }

  return { relatedMetricsByParentLabel, relatedMetricCodes };
}

const MetricAnomalyNotices = ({
  anomalies,
  corrected,
}: {
  anomalies: MetricAnomaly[];
  corrected: boolean;
}) => (
  <div className="col-span-full mt-3 space-y-3">
    {anomalies.map((anomaly) => (
      <div key={anomaly.id} aria-label="Anomalie détectée" role="note">
        <MetricAnomalyMessage anomaly={anomaly} />
      </div>
    ))}
    {corrected && (
      <p className="mb-0 text-sm text-[var(--text-mention-grey)]">
        Valeur corrigée. Le signalement restera affiché jusqu’à la prochaine
        analyse de Fonds vert.
      </p>
    )}
  </div>
);

const MetricCard = ({ children }: { children: ReactNode }) => (
  <div
    className={`
      relative grid h-full grid-cols-1 content-start items-start gap-x-6
      bg-[var(--background-alt-grey)] p-4
      sm:grid-cols-[minmax(0,1fr)_auto]
    `}
  >
    {children}
  </div>
);

const SimpleMetricRow = ({ metric }: { metric: SimpleMetric }) => {
  const metricId = slugify(metric.label);
  const estimee = metric.valeur_estimee ?? undefined;
  const { targets } = useMetricRevisions();
  const anomaliesByMetricCode = useMetricAnomaliesByMetricCode();
  const target = targets[metric.metricCode];
  const anomalies = anomaliesByMetricCode[metric.metricCode];

  return (
    <section
      aria-label={metric.label}
      className="h-full"
      data-testid={`metric-${metricId}`}
    >
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
            <MetricCorrectionEditor target={target} buttonLabel="Modifier" />
          </div>
        )}
        {anomalies?.length ? (
          <MetricAnomalyNotices
            anomalies={anomalies}
            corrected={(target?.revision ?? 1) > 1}
          />
        ) : null}
      </MetricCard>
    </section>
  );
};

const AvantApresTravauxRows = ({
  metric,
  relatedMetric,
  visibleMetricCodes,
}: {
  metric: Extract<ProcessedMetric, { _typename: "AvantApresTravaux" }>;
  relatedMetric?: SimpleMetric;
  visibleMetricCodes?: ReadonlySet<string>;
}) => {
  const metricId = slugify(metric.label);
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
      <h4 className="mb-4 text-base font-normal text-[var(--text-label-grey)]">
        {metric.label}
      </h4>
      <dl className="grid gap-4 sm:grid-cols-2">
        {rows.map(({ label, value, metricCode, target, testId }) => (
          <div
            key={label}
            className={
              relatedMetric?.label === label ? "sm:col-span-2" : "h-full"
            }
            aria-label={label}
            data-testid={
              relatedMetric?.label === label
                ? `metric-${slugify(label)}`
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
                  />
                </div>
              )}
              {anomaliesByMetricCode[metricCode]?.length ? (
                <MetricAnomalyNotices
                  anomalies={anomaliesByMetricCode[metricCode]}
                  corrected={(target?.revision ?? 1) > 1}
                />
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
      {Object.entries(metricGroups).map(([groupId, group]) => {
        const { relatedMetricsByParentLabel, relatedMetricCodes } =
          indexRelatedMetrics(group.metrics);
        const simpleMetrics = new Map(
          Object.values(group.metrics)
            .filter((metric) => metric._typename === "Simple")
            .map((metric) => [metric.metricCode, metric]),
        );
        const pairedMetricCodes = new Set(
          Object.entries(PAIRED_METRIC_CODES)
            .filter(([first]) => {
              const metric = simpleMetrics.get(first);
              return metric && isMetricVisible(metric, visibleMetricCodes);
            })
            .map(([, second]) => second),
        );

        return (
          <div
            key={groupId}
            className="metric-group"
            data-testid={`metric-group-${groupId}`}
          >
            {group.theme && (
              <h3
                className="mb-4 flex items-center gap-2 text-lg font-medium"
                data-testid={`metric-group-title-${groupId}`}
              >
                <span
                  aria-hidden="true"
                  className={`${group.theme.iconClass} ${group.theme.accentTextColor}`}
                />
                {group.theme.label}
              </h3>
            )}
            <div className="space-y-4">
              {Object.entries(group.metrics).map(([key, metric]) => {
                if (
                  metric._typename === "Simple" &&
                  (relatedMetricCodes.has(metric.metricCode) ||
                    pairedMetricCodes.has(metric.metricCode))
                ) {
                  return null;
                }

                if (metric._typename === "Simple") {
                  if (!isMetricVisible(metric, visibleMetricCodes)) return null;

                  const partner = simpleMetrics.get(
                    PAIRED_METRIC_CODES[metric.metricCode],
                  );
                  if (partner && isMetricVisible(partner, visibleMetricCodes)) {
                    return (
                      <div key={key} className="grid gap-4 sm:grid-cols-2">
                        <SimpleMetricRow metric={metric} />
                        <SimpleMetricRow metric={partner} />
                      </div>
                    );
                  }

                  return <SimpleMetricRow key={key} metric={metric} />;
                }

                const relatedMetric = relatedMetricsByParentLabel.get(
                  metric.label,
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
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
