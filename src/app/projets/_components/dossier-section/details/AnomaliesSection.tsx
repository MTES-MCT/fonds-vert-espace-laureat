"use client";

import Alert from "@codegouvfr/react-dsfr/Alert";
import Badge from "@codegouvfr/react-dsfr/Badge";

import {
  anomalyCategoryLabels,
  FondsVertAnomalyStatus,
} from "@/components/metrics/FondsVertAnomalyStatus";
import { useMetricRevisions } from "@/components/metrics/MetricRevisionContext";
import type { ResolvedFondsVertAnomalies } from "@/utils/metrics/anomalies";
import { metricEditorId } from "@/utils/metrics/editor";
import { METRIC_THEMES } from "@/utils/metrics/themes";

export function AnomaliesSection({
  anomalies,
  sourceUnavailable = false,
  hasLocalMetrics = false,
}: {
  anomalies: ResolvedFondsVertAnomalies;
  sourceUnavailable?: boolean;
  hasLocalMetrics?: boolean;
}) {
  const incomplete =
    anomalies.status === "incomplete" || anomalies.status === "invalid";
  const warnings = anomalies.warnings;
  const { targets } = useMetricRevisions();
  const hasCorrections = Object.values(targets).some(
    (target) => target.revision > 1,
  );
  const hasSignals =
    anomalies.indicatorCount > 0 ||
    anomalies.unspecifiedCategories.length > 0 ||
    anomalies.contextLabels.length > 0;

  return (
    <section
      id="signalements"
      aria-labelledby="anomalies-heading"
      className="border-b border-[var(--border-default-grey)] pb-8"
    >
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <h3 id="anomalies-heading" className="mb-0">
          Données à vérifier
        </h3>
        <span
          aria-label={
            anomalies.indicatorCount > 0 || anomalies.hasNoSignals
              ? `${anomalies.indicatorCount} indicateur${anomalies.indicatorCount === 1 ? "" : "s"} signalé${anomalies.indicatorCount === 1 ? "" : "s"}`
              : undefined
          }
        >
          <FondsVertAnomalyStatus anomalies={anomalies} />
        </span>
      </div>
      {hasCorrections && hasSignals && (
        <p className="mb-4 text-sm" role="note">
          Des corrections sont enregistrées localement. Le recalcul des
          signalements par Fonds vert est différé.
        </p>
      )}

      {sourceUnavailable ? (
        <Alert
          severity="error"
          small
          className="mb-4"
          description={
            hasLocalMetrics
              ? "Les données Fonds vert sont temporairement indisponibles. Les valeurs déjà enregistrées restent consultables."
              : "Les données Fonds vert sont temporairement indisponibles."
          }
        />
      ) : anomalies.status === "unavailable" ? (
        <p>Les signalements Fonds vert sont temporairement indisponibles.</p>
      ) : anomalies.status === "absent" ? (
        <p>Fonds vert n’a pas renseigné les signalements de ce projet.</p>
      ) : incomplete ? (
        <p>
          Les signalements reçus sont incomplets. Les informations disponibles
          restent affichées.
        </p>
      ) : null}

      {anomalies.indicators.length > 0 && (
        <ul
          aria-label="Indicateurs signalés"
          className="m-0 list-none space-y-6 p-0"
        >
          {anomalies.indicators.map((indicator, index) => {
            const theme = METRIC_THEMES.find(
              (item) => item.id === indicator.themeId,
            );
            return (
              <li key={indicator.id}>
                <section aria-labelledby={`anomaly-${index}-heading`}>
                  <h4 id={`anomaly-${index}-heading`} className="mb-2 text-lg">
                    {indicator.label}
                  </h4>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {indicator.categories.map((category) => (
                      <Badge
                        key={category}
                        small
                        severity={
                          category === "strong-inconsistency"
                            ? "error"
                            : "warning"
                        }
                      >
                        {anomalyCategoryLabels[category]}
                      </Badge>
                    ))}
                    {theme && (
                      <span className="text-sm text-[var(--text-mention-grey)]">
                        {theme.label}
                      </span>
                    )}
                  </div>
                  {indicator.editableTargets.length > 0 && (
                    <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
                      {indicator.editableTargets
                        .filter((target) => targets[target.metricCode])
                        .map((target) => {
                          const editorId = metricEditorId(target.metricCode);
                          return (
                            <li key={target.metricCode}>
                              <a href={`#${encodeURIComponent(editorId)}`}>
                                Vérifier {target.label}
                              </a>
                            </li>
                          );
                        })}
                    </ul>
                  )}
                  {indicator.editableTargets.length === 0 ? (
                    <p className="mb-0 text-sm">
                      Aucune valeur modifiable n’est disponible pour ce
                      signalement.
                    </p>
                  ) : indicator.unavailableMetricCodes.length > 0 ? (
                    <p className="mb-0 text-sm">
                      Certaines valeurs sources ne sont pas disponibles.
                    </p>
                  ) : null}
                </section>
              </li>
            );
          })}
        </ul>
      )}

      {anomalies.unspecifiedCategories.map((category) => (
        <p className="mt-4 mb-0" key={category}>
          {anomalyCategoryLabels[category]} sans indicateur précisé.
        </p>
      ))}

      {anomalies.contextLabels.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-2 text-base">Démarches concernées</h4>
          <ul className="mb-0">
            {anomalies.contextLabels.map((label, index) => (
              <li key={index}>{label}</li>
            ))}
          </ul>
        </div>
      )}

      {(warnings.status === "loaded" || warnings.status === "incomplete") &&
        warnings.data.length > 0 && (
          <div className="mt-6">
            <h4 className="mb-2 text-base">Avertissements Fonds vert</h4>
            <ul className="mb-0">
              {warnings.data.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      {warnings.status === "incomplete" || warnings.status === "invalid" ? (
        <p className="mt-4 mb-0 text-sm">
          Les avertissements Fonds vert sont incomplets.
        </p>
      ) : warnings.status === "unavailable" && !sourceUnavailable ? (
        <p className="mt-4 mb-0 text-sm">
          Les avertissements Fonds vert sont temporairement indisponibles.
        </p>
      ) : null}
    </section>
  );
}
