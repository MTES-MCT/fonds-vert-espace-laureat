"use client";

import { useMemo } from "react";

import { MetricsGrid } from "@/app/projets/_components/dossier-section/details/impact-details/MetricsGrid";
import type { MetricAnomaly } from "@/components/metrics/MetricAnomalyContext";
import type { Metrics } from "@/services/fondsvert/dossier";

export function AnomaliesSection({
  anomalies,
  metriques,
}: {
  anomalies: MetricAnomaly[];
  metriques: Metrics;
}) {
  const anomalousMetricCodes = useMemo(
    () => new Set(anomalies.map((anomaly) => anomaly.metricCode)),
    [anomalies],
  );

  if (anomalies.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="anomalies-heading"
      className="bg-white p-8 shadow-lg"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h3 id="anomalies-heading" className="mb-0">
                Données à vérifier
              </h3>
              {anomalies.length > 0 && (
                <span
                  aria-label={`${anomalies.length} anomalies`}
                  className={`
                    mt-0.5 flex size-6 items-center justify-center rounded-full
                    bg-[var(--background-flat-warning)] text-sm font-bold text-white
                  `}
                >
                  {anomalies.length}
                </span>
              )}
            </div>
          </div>
          <div className="max-w-xl">
            <p className="fr-text--sm mb-0 text-[var(--text-default-grey)]">
              Ces vérifications sont automatiques et s'appuient sur les données
              du dossier. Elles servent à fiabiliser les indicateurs d'impact.
              Vous pouvez corriger une valeur ici.
            </p>
          </div>
        </div>

        <MetricsGrid
          metriques={metriques}
          visibleMetricCodes={anomalousMetricCodes}
        />
      </div>
    </section>
  );
}
