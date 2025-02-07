import Link from "next/link";

import { Connexion } from "@/app/espace-laureat/_components/Connexion";
import { DossierSection } from "@/app/espace-laureat/_components/DossierSection";
import { getDemarcheDossiers } from "@/app/espace-laureat/_components/getDemarcheDossiers";
import { getDossier } from "@/app/espace-laureat/_components/getDossier";
import { getDossierFondsVert } from "@/services/fondsvert/dossier";
import { getSession } from "@/utils/session";

export default async function Versement({
  params,
}: {
  params: Promise<{ dossierNumber: string }>;
}) {
  const session = await getSession();
  const user = session?.user;

  if (!user || !user.email || !user.email_verified) {
    return <Connexion />;
  }
  const { dossierNumber: dossierNumberString } = await params;
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
    <div>
      <DossierSection
        dossierSubvention={dossierSubvention}
        dossierFondsVertResult={dossierFondsVertResult}
        impact={dossiersImpact.find(
          (impact) =>
            impact.champs.numeroDossierSubvention === dossierSubvention.numero,
        )}
      />
      <div>
        <Link
          className="fr-btn fr-btn--tertiary"
          href={`/espace-laureat${dossierNumberString.startsWith("12345") ? "/demo" : ""}#dossier-${dossierNumberString}`}
        >
          Retour
        </Link>
      </div>
    </div>
  );
}
