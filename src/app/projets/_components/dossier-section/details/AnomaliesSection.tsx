"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";

import { anomalyCategoryLabels } from "@/components/metrics/FondsVertAnomalyStatus";
import { MetricAnomalyMessage } from "@/components/metrics/MetricAnomalyMessage";
import { useMetricRevisions } from "@/components/metrics/MetricRevisionContext";
import type { ResolvedFondsVertAnomalies } from "@/utils/metrics/anomalies";

// Signals attached to a displayed value are shown next to it; this section
// keeps only what no value can carry: source states, unmatched indicators,
// unspecified categories, context labels and warnings.
export function AnomaliesSection({
  anomalies,
  sourceUnavailable = false,
  hasLocalMetrics = false,
}: {
  anomalies: ResolvedFondsVertAnomalies;
  sourceUnavailable?: boolean;
  hasLocalMetrics?: boolean;
}) {
  const { targets } = useMetricRevisions();
  const warnings = anomalies.warnings;
  const unmatchedIndicators = anomalies.indicators.filter(
    (indicator) => !indicator.metricCodes.some((code) => targets[code]),
  );
  const hasWarnings =
    (warnings.status === "loaded" || warnings.status === "incomplete") &&
    warnings.data.length > 0;
  const statusMessage = sourceUnavailable
    ? null
    : anomalies.status === "unavailable"
      ? "Les signalements Fonds vert sont temporairement indisponibles."
      : anomalies.status === "absent"
        ? "Fonds vert n’a pas renseigné les signalements de ce projet."
        : anomalies.status === "incomplete" || anomalies.status === "invalid"
          ? "Les signalements reçus sont incomplets. Les informations disponibles restent affichées."
          : null;
  const warningsMessage =
    warnings.status === "incomplete" || warnings.status === "invalid"
      ? "Les avertissements Fonds vert sont incomplets."
      : warnings.status === "unavailable" && !sourceUnavailable
        ? "Les avertissements Fonds vert sont temporairement indisponibles."
        : null;

  if (sourceUnavailable) {
    return (
      <Alert
        severity="error"
        small
        description={
          hasLocalMetrics
            ? "Les données Fonds vert sont temporairement indisponibles. Les valeurs déjà enregistrées restent consultables."
            : "Les données Fonds vert sont temporairement indisponibles."
        }
      />
    );
  }

  if (
    !statusMessage &&
    !warningsMessage &&
    !hasWarnings &&
    unmatchedIndicators.length === 0 &&
    anomalies.unspecifiedCategories.length === 0 &&
    anomalies.contextLabels.length === 0
  ) {
    return null;
  }

  return (
    <section
      aria-labelledby="anomalies-heading"
      className={`
        border-l-4 border-[var(--border-default-grey)] bg-[var(--background-alt-grey)] px-4 py-3
      `}
    >
      <h3 id="anomalies-heading" className="mb-2 text-base font-bold">
        Signalements Fonds vert
      </h3>
      {statusMessage && <p className="mb-2 text-sm">{statusMessage}</p>}

      {unmatchedIndicators.length > 0 && (
        <ul
          aria-label="Signalements sans valeur affichée"
          className="m-0 mb-2 list-none space-y-3 p-0"
        >
          {unmatchedIndicators.map((indicator) => (
            <li key={indicator.id} className="p-0">
              <MetricAnomalyMessage anomaly={indicator} />
            </li>
          ))}
        </ul>
      )}

      {anomalies.unspecifiedCategories.map((category) => (
        <p className="mb-2 text-sm" key={category}>
          {anomalyCategoryLabels[category]} sans indicateur précisé.
        </p>
      ))}

      {anomalies.contextLabels.length > 0 && (
        <div className="mb-2">
          <h4 className="mb-1 text-sm font-bold">Démarches concernées</h4>
          <ul className="mb-0 text-sm">
            {anomalies.contextLabels.map((label, index) => (
              <li key={index}>{label}</li>
            ))}
          </ul>
        </div>
      )}

      {hasWarnings && (
        <div className="mb-2">
          <h4 className="mb-1 text-sm font-bold">Avertissements Fonds vert</h4>
          <ul className="mb-0 text-sm">
            {warnings.data.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      {warningsMessage && <p className="mb-0 text-sm">{warningsMessage}</p>}
    </section>
  );
}
