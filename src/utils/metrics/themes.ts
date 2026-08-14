import { ProcessedMetric } from "@/services/fondsvert/dossier";

export type MetricTheme = {
  id: string;
  label: string;
  keywords: string[];
  accentTextColor: string;
  iconClass: string;
};

export const METRIC_THEMES: MetricTheme[] = [
  {
    id: "project",
    label: "Caractéristiques du projet",
    keywords: ["bâtiment", "surface", "Surface", "Nature des opérations"],
    accentTextColor: "text-gray-700",
    iconClass: "fr-icon-building-line",
  },
  {
    id: "energy",
    label: "Énergie",
    keywords: ["énergétique", "chauffage"],
    accentTextColor: "text-yellow-500",
    iconClass: "fr-icon-flashlight-line",
  },
  {
    id: "ges",
    label: "Gaz à Effet de Serre (GES)",
    keywords: ["GES"],
    accentTextColor: "text-green-500",
    iconClass: "fr-icon-leaf-line",
  },
  {
    id: "proximity-management",
    label: "Gestion de proximité",
    keywords: ["gestion de proximité"],
    accentTextColor: "text-orange-500",
    iconClass: "fr-icon-community-line",
  },
  {
    id: "separate-collection",
    label: "Collecte séparée",
    keywords: ["collecte", "collectés"],
    accentTextColor: "text-purple-500",
    iconClass: "fr-icon-recycle-line",
  },
];

function getMetricTheme(metricLabel: string): MetricTheme | null {
  for (const theme of METRIC_THEMES) {
    if (theme.keywords.some((keyword) => metricLabel.includes(keyword))) {
      return theme;
    }
  }
  return null;
}

// Organise les métriques en groupes thématiques et colorés
export function groupMetricsByTheme(
  metrics: Record<string, ProcessedMetric>,
): Record<
  string,
  {
    theme: MetricTheme | null;
    metrics: Record<string, ProcessedMetric>;
  }
> {
  const groups: Record<
    string,
    {
      theme: MetricTheme | null;
      metrics: Record<string, ProcessedMetric>;
    }
  > = {};

  groups["default"] = {
    theme: null,
    metrics: {},
  };

  METRIC_THEMES.forEach((theme) => {
    groups[theme.id] = {
      theme,
      metrics: {},
    };
  });

  // Assigner les métriques à leur groupe
  Object.entries(metrics).forEach(([key, metric]) => {
    const theme = getMetricTheme(metric.label);

    if (theme) {
      groups[theme.id].metrics[key] = metric;
    } else {
      groups["default"].metrics[key] = metric;
    }
  });

  // Supprimer les groupes vides pour éviter d'afficher des sections vides
  Object.keys(groups).forEach((groupId) => {
    if (Object.keys(groups[groupId].metrics).length === 0) {
      delete groups[groupId];
    }
  });

  return groups;
}
