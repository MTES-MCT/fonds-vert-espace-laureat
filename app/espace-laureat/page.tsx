import { Connexion } from "@/app/espace-laureat/_components/Connexion";
import { DossierSection } from "@/app/espace-laureat/_components/DossierSection";
import { getDossier } from "@/app/espace-laureat/_components/getDossier";
import { getPageTitle } from "@/app/espace-laureat/_components/getPageTitle";
import {
  getSearchParams,
  SearchParams,
} from "@/app/espace-laureat/_components/getParams";
import { getDossierNumbers } from "@/utils/fondsvert";
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

  const dossiers = await Promise.all(dossierRequests);
  const successDossiers = dossiers
    .filter((dossier) => dossier.success)
    .map((dossier) => dossier.data);

  const noResultMsg =
    "Assurez-vous de vous connecter avec l'adresse e-mail utilisée lors du dépôt de votre demande de subvention. Si vous avez besoin d'aide, n'hésitez pas à nous contacter.";

  return (
    <>
      <h1>{getPageTitle({ successDossiersLength: successDossiers.length })}</h1>

      {successDossiers.length === 0 ? (
        <div className="flex flex-col gap-y-6 text-center items-center justify-center border w-full h-96">
          <span
            className="text-gray-900 fr-icon-warning-fill fr-icon--lg"
            aria-hidden="true"
          ></span>
          <h2 className="text-lg max-w-lg mb-0">
            Aucun dossier n'est associé à l'adresse email {user.email} et au
            siret {siret}
          </h2>
          <p className="max-w-3xl mb-0 text-gray-700  text-balance">
            {noResultMsg}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-y-8">
          {successDossiers.map((dossier, index) => (
            <DossierSection key={index} dossier={dossier} />
          ))}{" "}
        </div>
      )}

      {successDossiers.length > 0 && (
        <p className="max-w-lg text-sm my-6">
          Vous ne trouvez pas votre dossier ? {noResultMsg}
        </p>
      )}
    </>
  );
}
