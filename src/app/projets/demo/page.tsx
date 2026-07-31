import { DossierSection } from "@/app/projets/_components/DossierSection";
import { DemoAnomaliesSection } from "@/app/projets/demo/DemoAnomaliesSection";
import { StartDsfrOnHydration } from "@/components/dsfr";
import { MetricRevisionProvider } from "@/components/metrics/MetricRevisionContext";
import type { DossierMetricRevisionTarget } from "@/db/dossierMetrics";
import { FinancesEJResult } from "@/services/fondsvert/finances";
import { resolveImpactStatus } from "@/services/impact/status";
import {
  demoDossier1,
  demoDossierFondsVert,
  demoFinancesEJ1,
  demoFinancesEJ2,
} from "@/utils/demo";
import {
  classifyMetricValue,
  isDisplayableMetricFields,
} from "@/utils/metrics/guards";

const demoMetricRevisionTargets: Record<string, DossierMetricRevisionTarget> =
  Object.fromEntries(
    Object.entries(demoDossierFondsVert.metrique_specifique ?? {}).flatMap(
      ([metricCode, metric]) =>
        isDisplayableMetricFields(metric)
          ? [
              [
                metricCode,
                {
                  metricCode,
                  revision: 1,
                  label: metric.label,
                  unit: metric.unite,
                  valueType: classifyMetricValue(metric.valeur_estimee)
                    .valueType,
                  sourceValue: metric.valeur_estimee,
                  effectiveValue: metric.valeur_estimee,
                },
              ],
            ]
          : [],
    ),
  );

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
            <MetricRevisionProvider
              key={index}
              dossierNumber={dossier.numero}
              initialTargets={demoMetricRevisionTargets}
              demo
            >
              <DossierSection
                isAdmin={false}
                dossierSubvention={dossier}
                dossierFondsVertResult={{
                  success: true,
                  data: demoDossierFondsVert,
                }}
                financesEJPromise={financesEJPromise}
                impactStatus={impactStatus}
                nocache={false}
                anomaliesSection={
                  <DemoAnomaliesSection dossierNumber={dossier.numero} />
                }
                impactPrefillUrl={process.env.DS_IMPACT_URL}
              />
            </MetricRevisionProvider>
          );
        })}
      </div>
    </>
  );
}
