import { DossierSection } from "@/app/projets/_components/DossierSection";
import { DemoAnomaliesSection } from "@/app/projets/demo/DemoAnomaliesSection";
import { DemoResetButton } from "@/app/projets/demo/DemoResetButton";
import { StartDsfrOnHydration } from "@/components/dsfr";
import { MetricRevisionProvider } from "@/components/metrics/MetricRevisionContext";
import { getDemoDossierMetricsSnapshot } from "@/db/demoMetrics";
import { FinancesEJResult } from "@/services/fondsvert/finances";
import { resolveImpactStatus } from "@/services/impact/status";
import {
  demoDossier1,
  demoDossierFondsVert,
  demoFinancesEJ1,
  demoFinancesEJ2,
} from "@/utils/demo";

export default async function EspaceLaureatDemo() {
  const dossiers = [demoDossier1];
  const metricsSnapshot = await getDemoDossierMetricsSnapshot();
  const storedMetrics =
    metricsSnapshot.status === "imported" ? metricsSnapshot.metrics : {};
  const dossierFondsVert = {
    ...demoDossierFondsVert,
    metrique_specifique: storedMetrics,
  };

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
              initialTargets={metricsSnapshot.targets}
              correctionApiPath="/api/projets/demo/metrics"
            >
              <DossierSection
                isAdmin={false}
                dossierSubvention={dossier}
                dossierFondsVertResult={{
                  success: true,
                  data: dossierFondsVert,
                }}
                financesEJPromise={financesEJPromise}
                impactStatus={impactStatus}
                nocache={false}
                anomaliesSection={
                  <DemoAnomaliesSection dossierNumber={dossier.numero} />
                }
                pageAction={<DemoResetButton />}
                impactPrefillUrl={process.env.DS_IMPACT_URL}
              />
            </MetricRevisionProvider>
          );
        })}
      </div>
    </>
  );
}
