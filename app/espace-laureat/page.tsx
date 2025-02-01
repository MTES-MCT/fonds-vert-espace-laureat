import { AucunDossier } from "@/app/espace-laureat/_components/AucunDossier";
import { Connexion } from "@/app/espace-laureat/_components/Connexion";
import { DossierSection } from "@/app/espace-laureat/_components/DossierSection";
import { getDemarcheDossiers } from "@/app/espace-laureat/_components/getDemarcheDossiers";
import { getDossier } from "@/app/espace-laureat/_components/getDossier";
import { getPageTitle } from "@/app/espace-laureat/_components/getPageTitle";
import {
  getSearchParams,
  SearchParams,
} from "@/app/espace-laureat/_components/getParams";
import { getDossierNumbers } from "@/services/fondsvert/dossiers";
import { getSession } from "@/utils/session";

export default async function EspaceLaureat({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getSession();
  const user = session?.user;

  if (!user || !user.email || !user.email_verified) {
    return <Connexion />;
  }

  const params = await getSearchParams({ searchParams });

  const siret = params.siret ?? user.siret;

  const dossierNumbers =
    params.dossierNumbers.length > 0
      ? params.dossierNumbers
      : await getDossierNumbers({ siret });

  const dossierRequests = dossierNumbers.map((dossierNumber) =>
    getDossier({ dossierNumber, userEmail: user.email }),
  );

  const demarcheImpactNumber = Number(process.env.DEMARCHE_IMPACT_NUMBER);

  if (!demarcheImpactNumber || isNaN(demarcheImpactNumber)) {
    throw new Error(
      "Une erreur est survenue lors du chargement des données d'impact",
    );
  }

  const dossiersImpactResult = await getDemarcheDossiers({
    demarcheNumber: demarcheImpactNumber,
    userEmail: user.email,
  });

  const dossiersImpact = dossiersImpactResult.success
    ? dossiersImpactResult.data
    : [];

  const dossiersSubventionResult = await Promise.all(dossierRequests);
  const dossiersSubvention = dossiersSubventionResult
    .filter((dossier) => dossier.success)
    .map((dossier) => dossier.data);

  const noResultMsg =
    "Assurez-vous de vous connecter avec l'adresse e-mail utilisée lors du dépôt de votre demande de subvention. Si vous avez besoin d'aide, n'hésitez pas à nous contacter.";

  return (
    <>
      <h1>
        {getPageTitle({ successDossiersLength: dossiersSubvention.length })}
      </h1>

      {dossiersSubvention.length === 0 ? (
        <AucunDossier
          siret={siret}
          email={user.email}
          noResultMsg={noResultMsg}
        />
      ) : (
        <div className="flex flex-col gap-y-8">
          {dossiersSubvention.map((dossier, index) => (
            <DossierSection
              key={index}
              dossier={dossier}
              impact={dossiersImpact.find(
                (impact) =>
                  impact.champs.numeroDossierSubvention === dossier.numero,
              )}
            />
          ))}
        </div>
      )}

      {dossiersSubvention.length > 0 && (
        <p className="max-w-lg text-sm my-6">
          Vous ne trouvez pas votre dossier ? {noResultMsg}
        </p>
      )}
    </>
  );
}
