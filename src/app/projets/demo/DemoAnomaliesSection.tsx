"use client";

import { type ReactNode, useMemo } from "react";

import { AnomaliesSection } from "@/app/projets/_components/dossier-section/details/AnomaliesSection";
import {
  type MetricAnomaly,
  MetricAnomalyProvider,
  useAllMetricAnomalies,
} from "@/components/metrics/MetricAnomalyContext";
import { useMetricRevisions } from "@/components/metrics/MetricRevisionContext";
import type { Metrics } from "@/services/fondsvert/dossier";

type NumericAnomalyRule = MetricAnomaly & {
  comparison: "greater-than" | "less-than";
  threshold: number;
};

const DEMO_ANOMALY_RULES: NumericAnomalyRule[] = [
  {
    metricCode: "conso_energetique_avant_travaux",
    comparison: "greater-than",
    threshold: 2000000,
    indicator: "Consommation énergétique avant travaux",
    problem: { label: "Consommation surfacique hors plage" },
    helpText: "Vérifier l'unité ou la surface de référence",
  },
  {
    metricCode: "emission_ges_avant_travaux",
    comparison: "greater-than",
    threshold: 400,
    indicator: "Émissions GES avant travaux",
    problem: {
      label: "Valeur supérieure à",
      metric: { value: 400, unite: "kgCO₂e" },
    },
    helpText: "Probable confusion kg / tonnes CO₂e",
  },
  {
    metricCode: "gain_energetique_estime_percentage",
    comparison: "less-than",
    threshold: 40,
    indicator: "Taux d'économies d'énergie estimé",
    problem: {
      label: "Inférieur au seuil attendu de",
      metric: { value: 40, unite: "%" },
    },
    helpText: "Vérifier les consommations avant et après travaux",
  },
];

function matchesRule(rule: NumericAnomalyRule, value: number): boolean {
  return rule.comparison === "greater-than"
    ? value > rule.threshold
    : value < rule.threshold;
}

function toAnomaly({
  comparison: _comparison,
  threshold: _threshold,
  ...anomaly
}: NumericAnomalyRule): MetricAnomaly {
  return anomaly;
}

export function DemoMetricAnomalyProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { targets } = useMetricRevisions();
  const anomalies = useMemo(
    () =>
      DEMO_ANOMALY_RULES.filter((rule) => {
        const target = targets[rule.metricCode];
        return target && matchesRule(rule, Number(target.effectiveValue));
      }).map(toAnomaly),
    [targets],
  );

  return (
    <MetricAnomalyProvider anomalies={anomalies}>
      {children}
    </MetricAnomalyProvider>
  );
}

export function DemoAnomaliesSection({ metriques }: { metriques: Metrics }) {
  const anomalies = useAllMetricAnomalies();
  return <AnomaliesSection anomalies={anomalies} metriques={metriques} />;
}
