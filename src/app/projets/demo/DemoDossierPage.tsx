import { AnomaliesSection } from "@/app/projets/_components/dossier-section/details/AnomaliesSection";
import {
  DossierSection,
  type ProjectSection,
} from "@/app/projets/_components/DossierSection";
import { startDossierMetricLoading } from "@/app/projets/_components/startDossierMetricLoading";
import { DemoResetButton } from "@/app/projets/demo/DemoResetButton";
import { DemoSourceControl } from "@/app/projets/demo/DemoSourceControl";
import { MetricAnomalyProvider } from "@/components/metrics/MetricAnomalyContext";
import { MetricRevisionProvider } from "@/components/metrics/MetricRevisionContext";
import { ToastViewport } from "@/components/toast/toast";
import { getDossierProgress } from "@/db/dossierProgress";
import { FinancesEJResult } from "@/services/fondsvert/finances";
import {
  demoDossier1,
  demoDossierFondsVert,
  demoFinancesEJ1,
  demoFinancesEJ2,
} from "@/utils/demo";
import { demoSignals, type DemoSourceState } from "@/utils/demo/anomalies";
import {
  normalizeFondsVertAnomalies,
  resolveEditableAnomalyTargets,
} from "@/utils/metrics/anomalies";

export async function DemoDossierPage({
  section = "summary",
  sourceState = "initial",
}: {
  section?: ProjectSection;
  sourceState?: DemoSourceState;
}) {
  const dossiers = [demoDossier1];
  const progressTarget = await getDossierProgress({
    numeroDossier: demoDossier1.numero,
  });
  const metricLoading = startDossierMetricLoading({
    numeroDossier: demoDossier1.numero,
    loadDossierFondsVert: async (includeMetrics) =>
      sourceState === "unavailable"
        ? {
            success: false,
            error: "Les données Fonds vert sont temporairement indisponibles.",
            signals: demoSignals(sourceState),
          }
        : {
            success: true,
            data: {
              ...demoDossierFondsVert,
              metrique_specifique: includeMetrics
                ? demoDossierFondsVert.metrique_specifique
                : undefined,
            },
            metricsStatus: includeMetrics ? "loaded" : "not-requested",
            signals: demoSignals(sourceState),
          },
  });
  const { dossierFondsVertResult, metricRevisionTargets, metrics } =
    await metricLoading.resultPromise;
  const anomalies = resolveEditableAnomalyTargets(
    normalizeFondsVertAnomalies(dossierFondsVertResult.signals),
    metrics,
  );

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
              <MetricAnomalyProvider anomalies={anomalies.indicators}>
                <DossierSection
                  isAdmin={false}
                  section={section}
                  navigationQuery={
                    sourceState === "initial"
                      ? undefined
                      : `?fondsVert=${sourceState}`
                  }
                  metrics={metrics}
                  view="porteur"
                  dossierSubvention={dossier}
                  dossierFondsVertResult={dossierFondsVertResult}
                  financesEJPromise={financesEJPromise}
                  progressTarget={progressTarget}
                  progressApiPath="/api/projets/demo/progress"
                  anomalies={anomalies}
                  anomaliesSection={
                    <AnomaliesSection
                      anomalies={anomalies}
                      sourceUnavailable={!dossierFondsVertResult.success}
                      hasLocalMetrics={Object.keys(metrics ?? {}).length > 0}
                    />
                  }
                  pageAction={
                    <div className="flex flex-wrap items-end gap-4">
                      <DemoSourceControl state={sourceState} />
                      <DemoResetButton />
                    </div>
                  }
                />
              </MetricAnomalyProvider>
            </MetricRevisionProvider>
          );
        })}
      </div>
    </>
  );
}
