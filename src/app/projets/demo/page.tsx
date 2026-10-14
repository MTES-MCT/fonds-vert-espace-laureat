import { DossierSection } from "@/app/projets/_components/DossierSection";
import { startDossierMetricLoading } from "@/app/projets/_components/startDossierMetricLoading";
import {
  DemoAnomaliesSection,
  DemoMetricAnomalyProvider,
} from "@/app/projets/demo/DemoAnomaliesSection";
import { DemoResetButton } from "@/app/projets/demo/DemoResetButton";
import { MetricRevisionProvider } from "@/components/metrics/MetricRevisionContext";
import { ToastViewport } from "@/components/toast/toast";
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
  const metricLoading = startDossierMetricLoading({
    numeroDossier: demoDossier1.numero,
    loadDossierFondsVert: async (includeMetrics) => ({
      success: true,
      data: {
        ...demoDossierFondsVert,
        metrique_specifique: includeMetrics
          ? demoDossierFondsVert.metrique_specifique
          : undefined,
      },
      metricsStatus: includeMetrics ? "loaded" : "not-requested",
    }),
  });
  const { dossierFondsVertResult, metricRevisionTargets } =
    await metricLoading.resultPromise;
  const storedMetrics = dossierFondsVertResult.success
    ? (dossierFondsVertResult.data.metrique_specifique ?? {})
    : {};

  const financesEJResult: FinancesEJResult = {
    [demoFinancesEJ1.numero_ej]: { success: true, data: demoFinancesEJ1 },
    [demoFinancesEJ2.numero_ej]: { success: true, data: demoFinancesEJ2 },
  };

  const financesEJPromise = Promise.resolve(financesEJResult);

  return (
    <>
      <ToastViewport />
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
              initialTargets={metricRevisionTargets}
              correctionApiPath="/api/projets/demo/metrics"
            >
              <DemoMetricAnomalyProvider>
                <DossierSection
                  isAdmin={false}
                  dossierSubvention={dossier}
                  dossierFondsVertResult={dossierFondsVertResult}
                  financesEJPromise={financesEJPromise}
                  impactStatus={impactStatus}
                  nocache={false}
                  anomaliesSection={
                    <DemoAnomaliesSection metriques={storedMetrics} />
                  }
                  pageAction={<DemoResetButton />}
                  impactPrefillUrl={process.env.DS_IMPACT_URL}
                />
              </DemoMetricAnomalyProvider>
            </MetricRevisionProvider>
          );
        })}
      </div>
    </>
  );
}
