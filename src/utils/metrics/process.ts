import type { Metrics, SimpleMetric } from "@/services/fondsvert/dossier";
import { isDisplayableMetricFields } from "@/utils/metrics/guards";

const AVANT_TRAVAUX = " avant travaux";
const APRES_TRAVAUX = " après travaux";

// Ratios read right after the values they compare, keyed by the measure name
// shared by the "avant travaux" and "après travaux" labels.
const RATIO_LABELS: Record<string, string> = {
  "Consommation énergétique": "Gain énergétique estimé",
  "Émissions de GES": "Émissions de GES évitées",
};

// Values read together although their labels do not share a measure name.
const FOLLOWING_METRIC_CODES: Record<string, readonly string[]> = {
  nature_operations: ["type_batiment"],
  surface_batiment_m2_avant_projet: [
    "surface_batiment_m2_apres_projet",
    "type_surface",
  ],
  nombre_habitant_gestion_proximite: [
    "tonnage_annuel_entrant_gestion_proximite",
  ],
  nombre_habitant_collecte_separee: [
    "quantite_globale_annuel_biodechets_collectes",
  ],
};

function measureName(label: string): string | undefined {
  for (const suffix of [AVANT_TRAVAUX, APRES_TRAVAUX]) {
    if (label.includes(suffix)) return label.replace(suffix, "").trim();
  }
  return undefined;
}

// Lists displayable metrics in reading order: each value is followed by its
// "après travaux" counterpart, its ratio and the values read with it.
export function orderMetrics(metrics: Metrics): SimpleMetric[] {
  if (!metrics) return [];

  const metricsByCode = new Map<string, SimpleMetric>();
  for (const [metricCode, value] of Object.entries(metrics)) {
    if (!isDisplayableMetricFields(value)) continue;
    metricsByCode.set(metricCode, {
      _typename: "Simple",
      metricCode,
      label: value.label,
      unite: value.unite,
      valeur_estimee: value.valeur_estimee,
    });
  }
  const codesByLabel = new Map(
    [...metricsByCode.values()].map((metric) => [
      metric.label,
      metric.metricCode,
    ]),
  );

  const followersOf = (metric: SimpleMetric): string[] => {
    const measure = measureName(metric.label);
    return [
      ...(metric.label.includes(AVANT_TRAVAUX)
        ? [metric.label.replace(AVANT_TRAVAUX, APRES_TRAVAUX)]
        : []),
      ...(measure && RATIO_LABELS[measure] ? [RATIO_LABELS[measure]] : []),
    ]
      .map((label) => codesByLabel.get(label))
      .concat(FOLLOWING_METRIC_CODES[metric.metricCode] ?? [])
      .filter(
        (code): code is string =>
          code !== undefined &&
          code !== metric.metricCode &&
          metricsByCode.has(code),
      );
  };

  const followers = new Set(
    [...metricsByCode.values()].flatMap((metric) => followersOf(metric)),
  );
  const ordered: SimpleMetric[] = [];
  const placed = new Set<string>();
  const place = (metricCode: string) => {
    const metric = metricsByCode.get(metricCode);
    if (!metric || placed.has(metricCode)) return;
    placed.add(metricCode);
    ordered.push(metric);
    followersOf(metric).forEach(place);
  };

  for (const metricCode of metricsByCode.keys()) {
    if (!followers.has(metricCode)) place(metricCode);
  }
  for (const metricCode of metricsByCode.keys()) place(metricCode);

  return ordered;
}
