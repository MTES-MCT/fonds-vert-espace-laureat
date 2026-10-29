import Badge from "@codegouvfr/react-dsfr/Badge";

import type {
  FondsVertAnomalyCategory,
  NormalizedFondsVertAnomalies,
} from "@/utils/metrics/anomalies";

export const anomalyCategoryLabels: Record<FondsVertAnomalyCategory, string> = {
  statistical: "Anomalie statistique",
  "strong-inconsistency": "Incohérence forte",
};

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

export function FondsVertAnomalyStatus({
  anomalies,
}: {
  anomalies: NormalizedFondsVertAnomalies;
}) {
  const summary = fondsVertAnomalySummary(anomalies);
  return (
    <Badge small severity={summary.severity}>
      {summary.label}
    </Badge>
  );
}
