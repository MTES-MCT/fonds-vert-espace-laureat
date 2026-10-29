import { DossierSection } from "@/app/projets/_components/DossierSection";
import { getDossier } from "@/app/projets/_components/getDossier";
import { RefreshOnVisibility } from "@/app/projets/_components/RefreshOnVisibility";
import { RefreshStatusProvider } from "@/app/projets/_components/RefreshStatusContext";
import { startDossierMetricLoading } from "@/app/projets/_components/startDossierMetricLoading";
import { MetricRevisionProvider } from "@/components/metrics/MetricRevisionContext";
import { ToastViewport } from "@/components/toast/toast";
import { getDossierProgress } from "@/db/dossierProgress";
import { getDossierFondsVert } from "@/services/fondsvert/dossier";
import {
  buildFinancesResult,
  loadFinancesEJ,
} from "@/services/fondsvert/finances";
import { extractEJNumbers } from "@/utils/finance";
import { isAdmin } from "@/utils/roles";
import { getAuthenticatedUser, getSession } from "@/utils/session";

export async function DossierPage({
  dossierNumber,
}: {
  dossierNumber: string;
}) {
  const user = await getAuthenticatedUser();
  const session = await getSession();

  const numeroDossier = Number(dossierNumber);

  const dossierSubventionResult = await getDossier({
    numeroDossier,
    userEmail: user.email,
  });

  if (!dossierSubventionResult.success) {
    return <div className="fr-container my-8">Introuvable</div>;
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
  const financesEJPromise = dossierFondsVertPromise.then(async (fvResult) => {
    if (!fvResult.success || !fvResult.data.information_financiere) {
      return {};
    }
    const ejNumbers = extractEJNumbers(fvResult.data.information_financiere);
    const results = await Promise.all(ejNumbers.map(loadFinancesEJ));
    return buildFinancesResult(results);
  });

  const [progressTarget, metricLoadingResult] = await Promise.all([
    getDossierProgress({ numeroDossier }),
    metricLoading.resultPromise,
  ]);
  const { dossierFondsVertResult, metricRevisionTargets } = metricLoadingResult;

  const dossierSubvention = dossierSubventionResult.data;
  return (
    <>
      <ToastViewport />
      <RefreshStatusProvider>
        <RefreshOnVisibility />
        <MetricRevisionProvider
          dossierNumber={numeroDossier}
          initialTargets={metricRevisionTargets}
        >
          <DossierSection
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
          />
        </MetricRevisionProvider>
      </RefreshStatusProvider>
    </>
  );
}
