import {
  MetricFields,
  Metrics,
  ProcessedMetric,
} from "@/services/fondsvert/dossier";

const AVANT_TRAVAUX = "avant travaux";
const APRES_TRAVAUX = "après travaux";

function extractBaseMetricName(label: string): string {
  return label
    .replace(` ${AVANT_TRAVAUX}`, "")
    .replace(` ${APRES_TRAVAUX}`, "")
    .trim();
}

function findAvantTravauxMetric(
  baseLabel: string,
  metrics: Metrics,
): { key: string; value: MetricFields } | null {
  for (const [key, value] of Object.entries(metrics)) {
    if (
      value.label.includes(` ${AVANT_TRAVAUX}`) &&
      extractBaseMetricName(value.label) === baseLabel
    ) {
      return { key, value };
    }
  }
  return null;
}

// Regroupe les métriques "avant/après travaux" dans une unique métrique
export function processMetrics(
  metrics: Metrics,
): Record<string, ProcessedMetric> {
  if (!metrics) return {};

  const processedMetrics: Record<string, ProcessedMetric> = {};
  const processedKeys = new Set<string>();

  for (const [apresKey, apresValue] of Object.entries(metrics)) {
    if (processedKeys.has(apresKey) || apresValue.valeur_estimee === null)
      continue;

    if (apresValue.label.includes(` ${APRES_TRAVAUX}`)) {
      const baseLabel = extractBaseMetricName(apresValue.label);
      const avantMetric = findAvantTravauxMetric(baseLabel, metrics);

      if (avantMetric) {
        const newKey = baseLabel.toLowerCase().replace(/\s+/g, "_");
        processedMetrics[newKey] = {
          _typename: "AvantApresTravaux",
          label: baseLabel,
          unite: apresValue.unite,
          valeur_avant_travaux: avantMetric.value.valeur_estimee,
          valeur_apres_travaux_estimee: apresValue.valeur_estimee,
          valeur_apres_travaux_reelle: apresValue.valeur_reelle,
        };

        processedKeys.add(apresKey);
        processedKeys.add(avantMetric.key);
      }
    }
  }

  for (const [key, value] of Object.entries(metrics)) {
    if (processedKeys.has(key) || value.valeur_estimee === null) continue;

    processedMetrics[key] = {
      _typename: "Simple",
      label: value.label,
      unite: value.unite,
      valeur_estimee: value.valeur_estimee,
      valeur_reelle: value.valeur_reelle,
    };

    processedKeys.add(key);
  }

  return processedMetrics;
}
