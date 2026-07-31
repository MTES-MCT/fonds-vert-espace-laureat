import { DossierSection } from "@/app/projets/_components/DossierSection";
import { getDemarcheDossiers } from "@/app/projets/_components/getDemarcheDossiers";
import { getDossier } from "@/app/projets/_components/getDossier";
import { RefreshOnVisibility } from "@/app/projets/_components/RefreshOnVisibility";
import { RefreshStatusProvider } from "@/app/projets/_components/RefreshStatusContext";
import { StartDsfrOnHydration } from "@/components/dsfr";
import {
  getDossierMetricsState,
  importDossierMetricsIfMissing,
} from "@/db/dossierMetrics";
import { getDossierFondsVert } from "@/services/fondsvert/dossier";
import {
  buildFinancesResult,
  loadFinancesEJ,
} from "@/services/fondsvert/finances";
import { resolveImpactStatus } from "@/services/impact/status";
import { extractEJNumbers } from "@/utils/finance";
import { isAdmin } from "@/utils/roles";
import { getAuthenticatedUser } from "@/utils/session";

export async function DossierPage({
  dossierNumber,
  searchParams,
}: {
  dossierNumber: string;
  searchParams: Promise<{ nocache?: string | string[] }>;
}) {
  const user = await getAuthenticatedUser();

  const { nocache } = await searchParams;

  const numeroDossier = Number(dossierNumber);

  const demarcheImpactNumber = Number(process.env.DEMARCHE_IMPACT_NUMBER);

  if (!demarcheImpactNumber || isNaN(demarcheImpactNumber)) {
    throw new Error(
      "Une erreur est survenue lors du chargement des données d'impact",
    );
  }

  // 1. Start independent lookups in parallel
  const dossierSubventionPromise = getDossier({
    numeroDossier,
    userEmail: user.email,
  });
  const storedMetricsPromise = getDossierMetricsState({ numeroDossier });
  const dossierFondsVertPromise = storedMetricsPromise.then((metricsState) =>
    getDossierFondsVert({
      numeroDossier,
      includeMetrics: metricsState.status !== "imported",
    }),
  );
  const dossiersImpactPromise = getDemarcheDossiers({
    demarcheNumber: demarcheImpactNumber,
    userEmail: user.email,
  });

  // 2. Chain EJ finances loading from FV promise immediately
  const financesEJPromise = dossierFondsVertPromise.then(async (fvResult) => {
    if (!fvResult.success || !fvResult.data.information_financiere) {
      return {};
    }
    const ejNumbers = extractEJNumbers(fvResult.data.information_financiere);
    const results = await Promise.all(ejNumbers.map(loadFinancesEJ));
    return buildFinancesResult(results);
  });

  // 3. Authorization guard: await getDossier
  const dossierSubventionResult = await dossierSubventionPromise;

  if (!dossierSubventionResult.success) {
    return <div className="fr-container my-8">Introuvable</div>;
  }

  // 4. Await remaining promises
  const [dossiersImpactResult, dossierFondsVertResult, metricsState] =
    await Promise.all([
      dossiersImpactPromise,
      dossierFondsVertPromise,
      storedMetricsPromise,
    ]);

  const dossierSubvention = dossierSubventionResult.data;
  const dossiersImpact = dossiersImpactResult.success
    ? dossiersImpactResult.data
    : [];
  const dossierFondsVert = dossierFondsVertResult.success
    ? dossierFondsVertResult.data
    : undefined;
  let localMetrics =
    metricsState.status === "imported" ? metricsState.metrics : undefined;

  if (
    metricsState.status === "not-imported" &&
    dossierFondsVertResult.success &&
    dossierFondsVertResult.metricsStatus === "loaded"
  ) {
    await importDossierMetricsIfMissing({
      numeroDossier,
      metrics: dossierFondsVertResult.data.metrique_specifique ?? {},
    });

    const importedMetricsState = await getDossierMetricsState({
      numeroDossier,
    });
    localMetrics =
      importedMetricsState.status === "imported"
        ? importedMetricsState.metrics
        : undefined;
  }

  const displayedDossierFondsVertResult =
    dossierFondsVertResult.success && localMetrics
      ? {
          success: true as const,
          data: {
            ...dossierFondsVertResult.data,
            metrique_specifique: localMetrics,
          },
        }
      : dossierFondsVertResult;
  const impactStatus = resolveImpactStatus({
    dossierSubventionNumero: dossierSubvention.numero,
    dossiersImpact,
    dossierFondsVert,
  });

  return (
    <>
      <StartDsfrOnHydration />
      <RefreshStatusProvider>
        <RefreshOnVisibility />
        <DossierSection
          isAdmin={isAdmin({ userEmail: user.email })}
          dossierSubvention={dossierSubvention}
          dossierFondsVertResult={displayedDossierFondsVertResult}
          financesEJPromise={financesEJPromise}
          impactStatus={impactStatus}
          nocache={nocache === "" || nocache === "1"}
        />
      </RefreshStatusProvider>
    </>
  );
}
