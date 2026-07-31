"use client";

import {
  AnomaliesSection,
  type Anomaly,
} from "@/app/projets/_components/dossier-section/details/AnomaliesSection";
import { useMetricRevisions } from "@/components/metrics/MetricRevisionContext";

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
  return <DemoAnomalies dossierNumber={dossierNumber} />;
}
