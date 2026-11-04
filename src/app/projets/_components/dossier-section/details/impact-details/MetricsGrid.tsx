"use client";

import { Fragment, type ReactNode } from "react";

import {
  factLabelClassName,
  factListClassName,
} from "@/components/fact-list/factList";
import {
  type MetricAnomaly,
  useMetricAnomaliesByMetricCode,
} from "@/components/metrics/MetricAnomalyContext";
import { MetricAnomalyMessage } from "@/components/metrics/MetricAnomalyMessage";
import { MetricCorrectionEditor } from "@/components/metrics/MetricCorrectionEditor";
import { useMetricRevisions } from "@/components/metrics/MetricRevisionContext";
import { MetricValue } from "@/components/metrics/MetricValue";
import type { DossierMetricRevisionTarget } from "@/db/dossierMetrics";
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
  <div className="space-y-2">
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

const MetricRow = ({
  label,
  target,
  anomalies,
  indented = false,
  children,
}: {
  label: string;
  target?: DossierMetricRevisionTarget;
  anomalies?: MetricAnomaly[];
  indented?: boolean;
  children: ReactNode;
}) => (
  <div
    className={`
      grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-6 gap-y-1 py-3
      sm:grid-cols-[15rem_minmax(0,1fr)_auto]
      lg:grid-cols-[15rem_minmax(0,1fr)_minmax(0,1fr)_auto]
    `}
  >
    <p
      className={`
        ${factLabelClassName}
        col-start-1 row-start-1 sm:pt-0.5
        ${indented ? "sm:pl-4" : ""}
      `}
    >
      {label}
    </p>
    <div className="col-start-1 row-start-2 min-w-0 sm:col-start-2 sm:row-start-1">
      {children}
    </div>
    {anomalies?.length ? (
      <div
        className={`
          col-start-1 row-start-3 mt-2 min-w-0
          sm:col-start-2 sm:row-start-2
          lg:col-start-3 lg:row-start-1 lg:mt-0
        `}
      >
        <MetricAnomalyNotices
          anomalies={anomalies}
          corrected={(target?.revision ?? 1) > 1}
        />
      </div>
    ) : null}
    {target && (
      <div
        className={`col-start-2 row-span-2 row-start-1 sm:col-start-3 sm:row-span-1 lg:col-start-4`}
      >
        <MetricCorrectionEditor target={target} buttonLabel="Modifier" />
      </div>
    )}
  </div>
);

const SimpleMetricRow = ({ metric }: { metric: SimpleMetric }) => {
  const metricId = slugify(metric.label);
  const estimee = metric.valeur_estimee ?? undefined;
  const { targets } = useMetricRevisions();
  const anomaliesByMetricCode = useMetricAnomaliesByMetricCode();

  return (
    <section aria-label={metric.label} data-testid={`metric-${metricId}`}>
      <MetricRow
        label={metric.label}
        target={targets[metric.metricCode]}
        anomalies={anomaliesByMetricCode[metric.metricCode]}
      >
        {estimee !== undefined && (
          <MetricValue
            value={estimee}
            accessibleName="Valeur effective"
            unite={metric.unite}
            testId="valeur-estimee"
          />
        )}
      </MetricRow>
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
  const rows = [
    {
      label: "Avant travaux",
      value: metric.valeur_avant_travaux,
      unite: metric.unite,
      metricCode: metric.beforeMetricCode,
      testId: "valeur-0",
    },
    {
      label: "Après travaux",
      value: metric.valeur_apres_travaux,
      unite: metric.unite,
      metricCode: metric.afterMetricCode,
      testId: "valeur-1",
    },
    ...(relatedMetric
      ? [
          {
            label: relatedMetric.label,
            value: relatedMetric.valeur_estimee,
            unite: relatedMetric.unite,
            metricCode: relatedMetric.metricCode,
            testId: "valeur-estimee",
          },
        ]
      : []),
  ].filter(
    ({ metricCode }) =>
      !visibleMetricCodes || visibleMetricCodes.has(metricCode),
  );

  return (
    <section
      aria-label={metric.label}
      className="divide-y divide-[var(--border-default-grey)]"
      data-testid={`metric-${metricId}`}
    >
      <h4 className="mb-0 pt-3 pb-1 text-sm font-bold">{metric.label}</h4>
      {rows.map(({ label, value, unite, metricCode, testId }) => (
        <div
          key={label}
          aria-label={label}
          data-testid={
            relatedMetric?.label === label
              ? `metric-${slugify(label)}`
              : undefined
          }
          role="group"
        >
          <MetricRow
            label={label}
            target={targets[metricCode]}
            anomalies={anomaliesByMetricCode[metricCode]}
            indented
          >
            <MetricValue
              value={value}
              accessibleName={label}
              unite={unite}
              testId={testId}
            />
          </MetricRow>
        </div>
      ))}
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
            <div className={factListClassName}>
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
                      <Fragment key={key}>
                        <SimpleMetricRow metric={metric} />
                        <SimpleMetricRow metric={partner} />
                      </Fragment>
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
