import { AnomaliesSection } from "@/app/projets/_components/dossier-section/details/AnomaliesSection";
import type { ProjectSection } from "@/app/projets/_components/DossierSection";
import { DossierSection } from "@/app/projets/_components/DossierSection";
import { getDossier } from "@/app/projets/_components/getDossier";
import { RefreshOnVisibility } from "@/app/projets/_components/RefreshOnVisibility";
import { RefreshStatusProvider } from "@/app/projets/_components/RefreshStatusContext";
import { startDossierMetricLoading } from "@/app/projets/_components/startDossierMetricLoading";
import { StartDsfrOnHydration } from "@/components/dsfr";
import { MetricAnomalyProvider } from "@/components/metrics/MetricAnomalyContext";
import { MetricRevisionProvider } from "@/components/metrics/MetricRevisionContext";
import { ToastViewport } from "@/components/toast/toast";
import { getDossierProgress } from "@/db/dossierProgress";
import { getDossierFondsVert } from "@/services/fondsvert/dossier";
import {
  buildFinancesResult,
  loadFinancesEJ,
} from "@/services/fondsvert/finances";
import { extractEJNumbers } from "@/utils/finance";
import {
  normalizeFondsVertAnomalies,
  resolveEditableAnomalyTargets,
} from "@/utils/metrics/anomalies";
import { isAdmin } from "@/utils/roles";
import { getAuthenticatedUser, getSession } from "@/utils/session";

export async function DossierPage({
  dossierNumber,
  section = "summary",
}: {
  dossierNumber: string;
  section?: ProjectSection;
}) {
  const user = await getAuthenticatedUser();
  const session = await getSession();

  const numeroDossier = Number(dossierNumber);

  const dossierSubventionResult = await getDossier({
    numeroDossier,
    userEmail: user.email,
  });

  if (!dossierSubventionResult.success) {
    return (
      <div className="fr-container my-8">
        Introuvable
        <StartDsfrOnHydration />
      </div>
    );
  }

  const metricLoading = startDossierMetricLoading({
    numeroDossier,
    loadDossierFondsVert: (includeMetrics) =>
      getDossierFondsVert({
        numeroDossier,
        includeMetrics,
      }),
  });
  const dossierFondsVertPromise = metricLoading.externalDossierPromise;
  const financesEJPromise =
    section === "impact"
      ? Promise.resolve({})
      : dossierFondsVertPromise.then(async (fvResult) => {
          if (!fvResult.success || !fvResult.data.information_financiere) {
            return {};
          }
          const ejNumbers = extractEJNumbers(
            fvResult.data.information_financiere,
          );
          const results = await Promise.all(ejNumbers.map(loadFinancesEJ));
          return buildFinancesResult(results);
        });

  const [progressTarget, metricLoadingResult] = await Promise.all([
    getDossierProgress({ numeroDossier }),
    metricLoading.resultPromise,
  ]);
  const { dossierFondsVertResult, metricRevisionTargets, metrics } =
    metricLoadingResult;

  const dossierSubvention = dossierSubventionResult.data;
  const anomalies = resolveEditableAnomalyTargets(
    normalizeFondsVertAnomalies(dossierFondsVertResult.signals),
    metrics,
  );
  return (
    <>
      <ToastViewport />
      <RefreshStatusProvider>
        <RefreshOnVisibility />
        <MetricRevisionProvider
          dossierNumber={numeroDossier}
          initialTargets={metricRevisionTargets}
        >
          <MetricAnomalyProvider anomalies={anomalies.indicators}>
            <DossierSection
              section={section}
              metrics={metrics}
              isAdmin={isAdmin({ userEmail: user.email })}
              view={
                isAdmin({ userEmail: user.email })
                  ? (session.projectView ?? "porteur")
                  : dossierSubvention.viewerRelationship
              }
              dossierSubvention={dossierSubvention}
              dossierFondsVertResult={dossierFondsVertResult}
              financesEJPromise={financesEJPromise}
              progressTarget={progressTarget}
              anomaliesSection={
                <AnomaliesSection
                  anomalies={anomalies}
                  sourceUnavailable={!dossierFondsVertResult.success}
                  hasLocalMetrics={Object.keys(metrics ?? {}).length > 0}
                />
              }
            />
          </MetricAnomalyProvider>
        </MetricRevisionProvider>
      </RefreshStatusProvider>
    </>
  );
}
