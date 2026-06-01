import {
  AnomaliesSection,
  type Anomaly,
} from "@/app/projets/_components/dossier-section/details/AnomaliesSection";
import { DossierSection } from "@/app/projets/_components/DossierSection";
import { StartDsfrOnHydration } from "@/components/dsfr";
import { FinancesEJResult } from "@/services/fondsvert/finances";
import { resolveImpactStatus } from "@/services/impact/status";
import {
  demoDossier1,
  demoDossierFondsVert,
  demoFinancesEJ1,
  demoFinancesEJ2,
} from "@/utils/demo";

const demoAnomalies: Anomaly[] = [
  {
    indicator: "Consommation énergétique avant travaux",
    declaredValue: { value: 350000, unite: "kWh" },
    problem: { label: "Consommation surfacique hors plage" },
    helpText: "Vérifier l'unité ou la surface de référence",
  },
  {
    indicator: "Émissions GES avant travaux",
    declaredValue: { value: 1250, unite: "tCO₂e" },
    problem: {
      label: "Valeur supérieure à",
      metric: { value: 1000, unite: "tCO₂e" },
    },
    helpText: "Probable confusion kg / tonnes CO₂e",
  },
  {
    indicator: "Taux d'économies d'énergie estimé",
    declaredValue: { value: 25, unite: "%" },
    problem: {
      label: "Inférieur au seuil attendu de",
      metric: { value: 40, unite: "%" },
    },
    helpText: "Vérifier les consommations avant et après travaux",
  },
];

export default async function EspaceLaureatDemo() {
  const dossiers = [demoDossier1];

  const financesEJResult: FinancesEJResult = {
    [demoFinancesEJ1.numero_ej]: { success: true, data: demoFinancesEJ1 },
    [demoFinancesEJ2.numero_ej]: { success: true, data: demoFinancesEJ2 },
  };

  const financesEJPromise = Promise.resolve(financesEJResult);

  return (
    <>
      <StartDsfrOnHydration />
      <div className="flex flex-col gap-y-8">
        {dossiers.map((dossier, index) => {
          const impactStatus = resolveImpactStatus({
            dossierSubventionNumero: dossier.numero,
            dossiersImpact: [],
            dossierFondsVert: demoDossierFondsVert,
          });

          return (
            <DossierSection
              isAdmin={false}
              key={index}
              dossierSubvention={dossier}
              dossierFondsVertResult={{
                success: true,
                data: demoDossierFondsVert,
              }}
              financesEJPromise={financesEJPromise}
              impactStatus={impactStatus}
              nocache={false}
              anomaliesSection={
                <AnomaliesSection
                  anomalies={demoAnomalies}
                  correctionUrl={`https://www.demarches-simplifiees.fr/dossiers/${dossier.numero}`}
                />
              }
            />
          );
        })}
      </div>
    </>
  );
}
