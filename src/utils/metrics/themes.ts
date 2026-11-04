import type { SimpleMetric } from "@/services/fondsvert/dossier";

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

// Organise les métriques en groupes thématiques et colorés, dans leur ordre
export function groupMetricsByTheme(
  metrics: SimpleMetric[],
): { id: string; theme: MetricTheme | null; metrics: SimpleMetric[] }[] {
  const groups = [
    { id: "default", theme: null, metrics: [] as SimpleMetric[] },
    ...METRIC_THEMES.map((theme) => ({
      id: theme.id,
      theme,
      metrics: [] as SimpleMetric[],
    })),
  ];

  for (const metric of metrics) {
    const themeId = getMetricTheme(metric.label)?.id ?? "default";
    groups.find((group) => group.id === themeId)?.metrics.push(metric);
  }

  // Supprimer les groupes vides pour éviter d'afficher des sections vides
  return groups.filter((group) => group.metrics.length > 0);
}
