"use client";

import {
  AnomaliesSection,
  type Anomaly,
} from "@/app/projets/_components/dossier-section/details/AnomaliesSection";
import {
  MetricRevisionProvider,
  useMetricRevisions,
} from "@/components/metrics/MetricRevisionContext";
import type { DossierMetricRevisionTarget } from "@/db/dossierMetrics";

const initialTargets: Record<string, DossierMetricRevisionTarget> = {
  conso_energetique_avant_travaux: {
    metricCode: "conso_energetique_avant_travaux",
    revision: 1,
    label: "Consommation énergétique avant travaux",
    unit: "kWh",
    valueType: "number",
    sourceValue: 2055650,
    effectiveValue: 2055650,
  },
  emission_ges_avant_travaux: {
    metricCode: "emission_ges_avant_travaux",
    revision: 1,
    label: "Émissions de GES avant travaux",
    unit: "kgCO₂e",
    valueType: "number",
    sourceValue: 448,
    effectiveValue: 448,
  },
  gain_energetique_estime_percentage: {
    metricCode: "gain_energetique_estime_percentage",
    revision: 1,
    label: "Gain énergétique estimé",
    unit: "%",
    valueType: "number",
    sourceValue: 32,
    effectiveValue: 32,
  },
};

function DemoAnomalies({ dossierNumber }: { dossierNumber: number }) {
  const { targets } = useMetricRevisions();
  const anomalies: Anomaly[] = [];

  if (
    Number(targets.conso_energetique_avant_travaux.effectiveValue) > 2000000
  ) {
    anomalies.push({
      metricCode: "conso_energetique_avant_travaux",
      indicator: "Consommation énergétique avant travaux",
      problem: { label: "Consommation surfacique hors plage" },
      helpText: "Vérifier l'unité ou la surface de référence",
    });
  }

  if (Number(targets.emission_ges_avant_travaux.effectiveValue) > 400) {
    anomalies.push({
      metricCode: "emission_ges_avant_travaux",
      indicator: "Émissions GES avant travaux",
      problem: {
        label: "Valeur supérieure à",
        metric: { value: 400, unite: "kgCO₂e" },
      },
      helpText: "Probable confusion kg / tonnes CO₂e",
    });
  }

  if (Number(targets.gain_energetique_estime_percentage.effectiveValue) < 40) {
    anomalies.push({
      metricCode: "gain_energetique_estime_percentage",
      indicator: "Taux d'économies d'énergie estimé",
      problem: {
        label: "Inférieur au seuil attendu de",
        metric: { value: 40, unite: "%" },
      },
      helpText: "Vérifier les consommations avant et après travaux",
    });
  }

  return (
    <AnomaliesSection
      anomalies={anomalies}
      correctionUrl={`https://demarche.numerique.gouv.fr/dossiers/${dossierNumber}`}
    />
  );
}

export function DemoAnomaliesSection({
  dossierNumber,
}: {
  dossierNumber: number;
}) {
  return (
    <MetricRevisionProvider
      dossierNumber={dossierNumber}
      initialTargets={initialTargets}
      demo
    >
      <DemoAnomalies dossierNumber={dossierNumber} />
    </MetricRevisionProvider>
  );
}
