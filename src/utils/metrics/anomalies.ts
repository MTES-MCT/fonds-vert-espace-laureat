import type {
  AnomaliesSection,
  AvertissementsSection,
  FondsVertSignals,
} from "@/services/fondsvert/anomalies";
import type { Metrics } from "@/services/fondsvert/dossier";
import { isDisplayableMetricFields } from "@/utils/metrics/guards";

export type FondsVertAnomalyCategory = "statistical" | "strong-inconsistency";
export type FondsVertAnomalyTheme =
  | "project"
  | "energy"
  | "ges"
  | "separate-collection";

export type NormalizedMetricAnomaly = {
  id: string;
  label: string;
  rawLabels: string[];
  categories: FondsVertAnomalyCategory[];
  severity: FondsVertAnomalyCategory;
  themeId: FondsVertAnomalyTheme | null;
  metricCodes: string[];
  provenance: "fonds-vert";
};

export type NormalizedFondsVertAnomalies = {
  status: AnomaliesSection["status"];
  indicators: NormalizedMetricAnomaly[];
  indicatorCount: number;
  unspecifiedCategories: FondsVertAnomalyCategory[];
  contextLabels: string[];
  warnings: AvertissementsSection;
  diagnostics: string[];
  hasNoSignals: boolean;
};

export type EditableAnomalyTarget = { metricCode: string; label: string };
export type ResolvedMetricAnomaly = NormalizedMetricAnomaly & {
  editableTargets: EditableAnomalyTarget[];
  unavailableMetricCodes: string[];
};
export type ResolvedFondsVertAnomalies = Omit<
  NormalizedFondsVertAnomalies,
  "indicators"
> & {
  indicators: ResolvedMetricAnomaly[];
};

type IndicatorMapping = {
  labels: readonly string[];
  themeId: FondsVertAnomalyTheme;
  metricCodes: readonly string[];
};

const indicatorMappings: IndicatorMapping[] = [
  {
    labels: [
      "Surface du bâtiment avant projet",
      "Surface de bâtiment concernée par l'opération en m² (avant projet et hors extension)",
    ],
    themeId: "project",
    metricCodes: ["surface_batiment_m2_avant_projet"],
  },
  {
    labels: [
      "Surface du batiment après le projet. Donnée non disponible en 2024",
    ],
    themeId: "project",
    metricCodes: ["surface_batiment_m2_apres_projet"],
  },
  {
    labels: [
      "Consommation énergétique avant travaux",
      "Consommation énergétique avant travaux (en kWhEF/an)",
    ],
    themeId: "energy",
    metricCodes: ["conso_energetique_avant_travaux"],
  },
  {
    labels: [
      "Consommation énergétique après travaux",
      "Consommation énergétique après travaux (en kWhEF/an)",
    ],
    themeId: "energy",
    metricCodes: ["conso_energetique_apres_travaux"],
  },
  {
    labels: [
      "Émissions de GES avant travaux",
      "Emissions GES initiales avant travaux (en kgEqCo2/an)",
    ],
    themeId: "ges",
    metricCodes: ["emission_ges_avant_travaux"],
  },
  {
    labels: [
      "Émissions de GES après travaux",
      "Emissions GES initiales après travaux (en kgEqCo2/an)",
    ],
    themeId: "ges",
    metricCodes: ["emission_ges_apres_travaux"],
  },
  {
    labels: ["Gain énergétique estimé (en %)", "Gain énergétique estimé"],
    themeId: "energy",
    metricCodes: [
      "conso_energetique_avant_travaux",
      "conso_energetique_apres_travaux",
    ],
  },
  {
    labels: ["Emissions de GES évitées (en %)", "Émissions de GES évitées"],
    themeId: "ges",
    metricCodes: ["emission_ges_avant_travaux", "emission_ges_apres_travaux"],
  },
  {
    labels: [
      "Quantité globale de biodéchets collectés visée (en t/an)",
      "Quantité annuelle globale de biodéchets collectés",
    ],
    themeId: "separate-collection",
    metricCodes: ["quantite_globale_annuel_biodechets_collectes"],
  },
];

function labelIdentity(label: string): string {
  return label.normalize("NFC").trim();
}

const mappingsByLabel = new Map(
  indicatorMappings.flatMap((mapping) =>
    mapping.labels.map((label) => [labelIdentity(label), mapping] as const),
  ),
);

export function normalizeFondsVertAnomalies(
  signals: FondsVertSignals,
): NormalizedFondsVertAnomalies {
  const section = signals.anomalies;
  const warnings: AvertissementsSection =
    signals.avertissements.status === "loaded"
      ? { status: "loaded", data: [...signals.avertissements.data] }
      : { status: signals.avertissements.status };
  const normalized: NormalizedFondsVertAnomalies = {
    status: section.status,
    indicators: [],
    indicatorCount: 0,
    unspecifiedCategories: [],
    contextLabels: [],
    warnings,
    diagnostics: [],
    hasNoSignals: false,
  };
  if (!("data" in section)) return normalized;

  const { data } = section;
  normalized.diagnostics = [...section.diagnostics];
  normalized.contextLabels = [...(data.anomalie_demarche_list ?? [])];
  const indicators = new Map<string, NormalizedMetricAnomaly>();
  for (const { category, flag, labels } of [
    {
      category: "statistical",
      flag: data.est_anomalie,
      labels: data.anomalie_indicateur_list,
    },
    {
      category: "strong-inconsistency",
      flag: data.est_error,
      labels: data.error_indicateur_list,
    },
  ] as const) {
    if (flag === true && !labels?.length)
      normalized.unspecifiedCategories.push(category);
    for (const rawLabel of labels ?? []) {
      const id = labelIdentity(rawLabel);
      const existing = indicators.get(id);
      if (existing) {
        if (!existing.rawLabels.includes(rawLabel))
          existing.rawLabels.push(rawLabel);
        if (!existing.categories.includes(category))
          existing.categories.push(category);
        if (category === "strong-inconsistency") existing.severity = category;
        continue;
      }
      const mapping = mappingsByLabel.get(id);
      indicators.set(id, {
        id,
        label: rawLabel,
        rawLabels: [rawLabel],
        categories: [category],
        severity: category,
        themeId: mapping?.themeId ?? null,
        metricCodes: mapping ? [...mapping.metricCodes] : [],
        provenance: "fonds-vert",
      });
    }
  }
  normalized.indicators = [...indicators.values()];
  normalized.indicatorCount = indicators.size;
  if (
    normalized.indicators.some(
      (indicator) => indicator.metricCodes.length === 0,
    )
  ) {
    normalized.diagnostics.push("indicators:unmapped-label");
  }
  normalized.hasNoSignals =
    section.status === "loaded" &&
    data.est_anomalie === false &&
    data.est_error === false &&
    data.anomalie_demarche_list?.length === 0 &&
    data.anomalie_indicateur_list?.length === 0 &&
    data.error_indicateur_list?.length === 0;
  return normalized;
}

export function resolveEditableAnomalyTargets(
  anomalies: NormalizedFondsVertAnomalies,
  metrics: Metrics | undefined,
): ResolvedFondsVertAnomalies {
  return {
    ...anomalies,
    indicators: anomalies.indicators.map((indicator) => {
      const editableTargets: EditableAnomalyTarget[] = [];
      const unavailableMetricCodes: string[] = [];
      for (const metricCode of indicator.metricCodes) {
        const metric = metrics?.[metricCode];
        if (isDisplayableMetricFields(metric)) {
          editableTargets.push({ metricCode, label: metric.label });
        } else {
          unavailableMetricCodes.push(metricCode);
        }
      }
      return { ...indicator, editableTargets, unavailableMetricCodes };
    }),
  };
}
