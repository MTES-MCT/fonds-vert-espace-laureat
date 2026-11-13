import Badge from "@codegouvfr/react-dsfr/Badge";

import type {
  FondsVertAnomalyCategory,
  NormalizedFondsVertAnomalies,
} from "@/utils/metrics/anomalies";

// Named after the two Fonds vert lists: anomalie_indicateur_list and
// error_indicateur_list.
export const anomalyCategoryLabels: Record<FondsVertAnomalyCategory, string> = {
  statistical: "Anomalie",
  "strong-inconsistency": "Erreur",
};

export function FondsVertCategoryBadge({
  category,
}: {
  category: FondsVertAnomalyCategory;
}) {
  return category === "strong-inconsistency" ? (
    <Badge small severity="error">
      {anomalyCategoryLabels[category]}
    </Badge>
  ) : (
    <Badge small className="fr-badge--yellow-tournesol">
      <span
        aria-hidden="true"
        className="fr-icon-warning-fill fr-icon--xs mr-1"
      />
      {anomalyCategoryLabels[category]}
    </Badge>
  );
}

export function fondsVertAnomalySummary(
  anomalies: NormalizedFondsVertAnomalies,
) {
  const strong =
    anomalies.indicators.some(
      (indicator) => indicator.severity === "strong-inconsistency",
    ) || anomalies.unspecifiedCategories.includes("strong-inconsistency");
  if (anomalies.indicatorCount > 0) {
    return {
      label: `${anomalies.indicatorCount} donnée${anomalies.indicatorCount > 1 ? "s" : ""} à vérifier`,
      severity: strong ? ("error" as const) : ("warning" as const),
    };
  }
  if (
    anomalies.unspecifiedCategories.length > 0 ||
    anomalies.contextLabels.length > 0
  )
    return {
      label: "Signalement à préciser",
      severity: strong ? ("error" as const) : ("warning" as const),
    };
  if (anomalies.hasNoSignals)
    return { label: "Aucun signalement", severity: "success" as const };
  if (anomalies.status === "unavailable")
    return { label: "Signalements indisponibles", severity: "info" as const };
  if (anomalies.status === "absent")
    return { label: "Signalements non renseignés", severity: "info" as const };
  return { label: "Signalements incomplets", severity: "warning" as const };
}

export function fondsVertListAnomalySummary(
  anomalies: NormalizedFondsVertAnomalies,
): ReturnType<typeof fondsVertAnomalySummary> {
  const summary = fondsVertAnomalySummary(anomalies);
  if (anomalies.indicatorCount > 0 && anomalies.status !== "loaded") {
    return { ...summary, label: `Au moins ${summary.label}` };
  }
  if (
    anomalies.indicatorCount > 0 ||
    anomalies.unspecifiedCategories.length > 0 ||
    anomalies.contextLabels.length > 0
  ) {
    return summary;
  }

  const warnings = anomalies.warnings;
  if ("data" in warnings && warnings.data.length > 0) {
    return { label: "Avertissements à consulter", severity: "warning" };
  }
  if (anomalies.hasNoSignals) {
    if (warnings.status === "invalid" || warnings.status === "incomplete") {
      return { label: "Avertissements incomplets", severity: "warning" };
    }
    if (warnings.status === "unavailable") {
      return { label: "Avertissements indisponibles", severity: "info" };
    }
  }
  return summary;
}
