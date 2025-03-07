import { DossierSection } from "@/app/espace-laureat/_components/DossierSection";
import { getDemarcheDossiers } from "@/app/espace-laureat/_components/getDemarcheDossiers";
import { getDossier } from "@/app/espace-laureat/_components/getDossier";
import { getDossierFondsVert } from "@/services/fondsvert/dossier";
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
    return <>Introuvable</>;
  }

  const dossierSubvention = dossierSubventionResult.data;

  const dossiersImpact = dossiersImpactResult.success
    ? dossiersImpactResult.data
    : [];

  return (
    <DossierSection
      isAdmin={isAdmin({ userEmail: user.email })}
      dossierSubvention={dossierSubvention}
      dossierFondsVertResult={dossierFondsVertResult}
      impact={dossiersImpact.find(
        (impact) =>
          impact.champs.numeroDossierSubvention === dossierSubvention.numero,
      )}
      nocache={["", "1"].includes(nocache)}
    />
  );
}
