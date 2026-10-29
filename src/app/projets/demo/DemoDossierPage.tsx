import {
  DossierSection,
  type ProjectSection,
} from "@/app/projets/_components/DossierSection";
import { startDossierMetricLoading } from "@/app/projets/_components/startDossierMetricLoading";
import {
  DemoAnomaliesSection,
  DemoMetricAnomalyProvider,
} from "@/app/projets/demo/DemoAnomaliesSection";
import { DemoResetButton } from "@/app/projets/demo/DemoResetButton";
import { MetricRevisionProvider } from "@/components/metrics/MetricRevisionContext";
import { ToastViewport } from "@/components/toast/toast";
import { getDossierProgress } from "@/db/dossierProgress";
import { readFondsVertSignals } from "@/services/fondsvert/anomalies";
import { FinancesEJResult } from "@/services/fondsvert/finances";
import {
  demoDossier1,
  demoDossierFondsVert,
  demoFinancesEJ1,
  demoFinancesEJ2,
} from "@/utils/demo";

export async function DemoDossierPage({
  section = "summary",
}: {
  section?: ProjectSection;
}) {
  const dossiers = [demoDossier1];
  const progressTarget = await getDossierProgress({
    numeroDossier: demoDossier1.numero,
  });
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
      signals: readFondsVertSignals({ ...demoDossierFondsVert }),
    }),
  });
  const { dossierFondsVertResult, metricRevisionTargets, metrics } =
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
                  section={section}
                  metrics={metrics}
                  view="porteur"
                  dossierSubvention={dossier}
                  dossierFondsVertResult={dossierFondsVertResult}
                  financesEJPromise={financesEJPromise}
                  progressTarget={progressTarget}
                  progressApiPath="/api/projets/demo/progress"
                  anomaliesSection={
                    <DemoAnomaliesSection metriques={storedMetrics} />
                  }
                  pageAction={<DemoResetButton />}
                />
              </DemoMetricAnomalyProvider>
            </MetricRevisionProvider>
          );
        })}
      </div>
    </>
  );
}
