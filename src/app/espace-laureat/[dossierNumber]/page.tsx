import { DossierSection } from "@/app/espace-laureat/_components/DossierSection";
import { getDemarcheDossiers } from "@/app/espace-laureat/_components/getDemarcheDossiers";
import { getDossier } from "@/app/espace-laureat/_components/getDossier";
import { StartDsfrOnHydration } from "@/components/dsfr";
import { getDossierFondsVert } from "@/services/fondsvert/dossier";
import {
  buildFinancesResult,
  loadFinancesEJ,
} from "@/services/fondsvert/finances";
import { resolveImpactStatus } from "@/services/impact/status";
import { extractEJNumbers } from "@/utils/finance";
import { isAdmin } from "@/utils/roles";
import { getAuthenticatedUser } from "@/utils/session";

export default async function DossierPage({
  params,
  searchParams,
}: {
  params: Promise<{ dossierNumber: string }>;
  searchParams: Promise<{ nocache: string }>;
}) {
  const user = await getAuthenticatedUser();

  const { dossierNumber: dossierNumberString } = await params;
  const { nocache } = await searchParams;

  const numeroDossier = Number(dossierNumberString);

  const demarcheImpactNumber = Number(process.env.DEMARCHE_IMPACT_NUMBER);

  if (!demarcheImpactNumber || isNaN(demarcheImpactNumber)) {
    throw new Error(
      "Une erreur est survenue lors du chargement des données d'impact",
    );
  }

  // 1. Start all initial fetches in parallel
  const dossierSubventionPromise = getDossier({
    numeroDossier,
    userEmail: user.email,
  });
  const dossierFondsVertPromise = getDossierFondsVert({ numeroDossier });
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

  // Note: all 3 API calls run in parallel and respond at roughly the same time
  // (~500-600ms), so awaiting all results (3. and 4.) is fine.

  // 3. Authorization guard: await getDossier
  const dossierSubventionResult = await dossierSubventionPromise;

  if (!dossierSubventionResult.success) {
    return <div className="fr-container my-8">Introuvable</div>;
  }

  // 4. Await remaining promises
  const [dossiersImpactResult, dossierFondsVertResult] = await Promise.all([
    dossiersImpactPromise,
    dossierFondsVertPromise,
  ]);

  const dossierSubvention = dossierSubventionResult.data;
  const dossiersImpact = dossiersImpactResult.success
    ? dossiersImpactResult.data
    : [];
  const dossierFondsVert = dossierFondsVertResult.success
    ? dossierFondsVertResult.data
    : undefined;
  const impactStatus = resolveImpactStatus({
    dossierSubventionNumero: dossierSubvention.numero,
    dossiersImpact,
    dossierFondsVert,
  });

  return (
    <>
      <StartDsfrOnHydration />
      <DossierSection
        isAdmin={isAdmin({ userEmail: user.email })}
        dossierSubvention={dossierSubvention}
        dossierFondsVertResult={dossierFondsVertResult}
        financesEJPromise={financesEJPromise}
        impactStatus={impactStatus}
        nocache={["", "1"].includes(nocache)}
      />
    </>
  );
}
