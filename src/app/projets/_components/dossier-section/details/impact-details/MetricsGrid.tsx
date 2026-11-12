"use client";

import type { ReactNode } from "react";

import { FactList, FactRow } from "@/components/fact-list/FactList";
import { useMetricAnomaliesByMetricCode } from "@/components/metrics/MetricAnomalyContext";
import { MetricCorrectionEditor } from "@/components/metrics/MetricCorrectionEditor";
import { useMetricRevisions } from "@/components/metrics/MetricRevisionContext";
import { MetricValue } from "@/components/metrics/MetricValue";
import { MetricValueSignals } from "@/components/metrics/MetricValueSignals";
import type { DossierMetricRevisionTarget } from "@/db/dossierMetrics";
import type { Metrics, SimpleMetric } from "@/services/fondsvert/dossier";
import { slugify } from "@/utils/format";
import type { NormalizedMetricAnomaly } from "@/utils/metrics/anomalies";
import { isMetricFields } from "@/utils/metrics/guards";
import { orderMetrics } from "@/utils/metrics/process";
import { groupMetricsByTheme } from "@/utils/metrics/themes";

type MetricsGridProps = {
  metriques?: Metrics;
};

const MetricRow = ({
  id,
  label,
  target,
  anomalies,
  children,
}: {
  id: string;
  label: string;
  target?: DossierMetricRevisionTarget;
  anomalies?: NormalizedMetricAnomaly[];
  children: ReactNode;
}) => (
  <FactRow
    id={id}
    label={label}
    aside={
      anomalies?.length ? (
        <MetricValueSignals
          anomalies={anomalies}
          corrected={(target?.revision ?? 1) > 1}
        />
      ) : undefined
    }
    action={target ? <MetricCorrectionEditor target={target} /> : undefined}
  >
    {children}
  </FactRow>
);

const SimpleMetricRow = ({ metric }: { metric: SimpleMetric }) => {
  const metricId = slugify(metric.label);
  const estimee = metric.valeur_estimee ?? undefined;
  const { targets } = useMetricRevisions();
  const anomaliesByMetricCode = useMetricAnomaliesByMetricCode();

  return (
    <section aria-label={metric.label} data-testid={`metric-${metricId}`}>
      <MetricRow
        id={`metric-label-${metric.metricCode}`}
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

export function MetricsGrid({ metriques }: MetricsGridProps) {
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
  const metricGroups = groupMetricsByTheme(orderMetrics(effectiveMetrics));

  if (metricGroups.length === 0) return null;

  return (
    <div className="space-y-8">
      {metricGroups.map((group) => (
        <div
          key={group.id}
          className="metric-group"
          data-testid={`metric-group-${group.id}`}
        >
          {group.theme && (
            <h3
              className="mb-4 flex items-center gap-2 text-lg font-medium"
              data-testid={`metric-group-title-${group.id}`}
            >
              <span
                aria-hidden="true"
                className={`${group.theme.iconClass} ${group.theme.accentTextColor}`}
              />
              {group.theme.label}
            </h3>
          )}
          <FactList>
            {group.metrics.map((metric) => (
              <SimpleMetricRow key={metric.metricCode} metric={metric} />
            ))}
          </FactList>
        </div>
      ))}
    </div>
  );
}
