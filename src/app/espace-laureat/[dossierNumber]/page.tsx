import { DossierSection } from "@/app/espace-laureat/_components/DossierSection";
import { getDemarcheDossiers } from "@/app/espace-laureat/_components/getDemarcheDossiers";
import { getDossier } from "@/app/espace-laureat/_components/getDossier";
import { StartDsfrOnHydration } from "@/components/dsfr";
import { getDossierFondsVert } from "@/services/fondsvert/dossier";
import { FinancesEJData, getFinancesEJ } from "@/services/fondsvert/finances";
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

  const [
    dossierSubventionResult,
    dossiersImpactResult,
    dossierFondsVertResult,
  ] = await Promise.all([
    getDossier({
      numeroDossier,
      userEmail: user.email,
    }),
    getDemarcheDossiers({
      demarcheNumber: demarcheImpactNumber,
      userEmail: user.email,
    }),
    getDossierFondsVert({
      numeroDossier,
    }),
  ]);

  if (!dossierSubventionResult.success) {
    return <div className="fr-container my-8">Introuvable</div>;
  }

  const dossierSubvention = dossierSubventionResult.data;

  const dossiersImpact = dossiersImpactResult.success
    ? dossiersImpactResult.data
    : [];

  let financesEJMap: Record<string, FinancesEJData> = {};

  if (
    dossierFondsVertResult.success &&
    dossierFondsVertResult.data.information_financiere
  ) {
    const allEJs =
      dossierFondsVertResult.data.information_financiere.informations_engagement
        .flatMap((info) => info.engagements_juridiques)
        .map((ej) => ej.numero_ej);

    const uniqueEJs = [...new Set(allEJs)];

    const financesResults = await Promise.all(
      uniqueEJs.map(async (numeroEJ) => {
        const result = await getFinancesEJ({ numeroEJ });
        return { numeroEJ, result };
      }),
    );

    financesEJMap = financesResults.reduce(
      (acc, { numeroEJ, result }) => {
        if (result.success) {
          acc[numeroEJ] = result.data.data;
        }
        return acc;
      },
      {} as Record<string, FinancesEJData>,
    );
  }

  return (
    <>
      <StartDsfrOnHydration />
      <DossierSection
        isAdmin={isAdmin({ userEmail: user.email })}
        dossierSubvention={dossierSubvention}
        dossierFondsVertResult={dossierFondsVertResult}
        financesEJMap={financesEJMap}
        impact={dossiersImpact.find(
          (impact) =>
            impact.champs.numeroDossierSubvention === dossierSubvention.numero,
        )}
        nocache={["", "1"].includes(nocache)}
      />
    </>
  );
}
