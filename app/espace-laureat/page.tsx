import { getDossierNumbers } from "@/services/fondsvert/dossiers";
import { getSession } from "@/utils/session";

import { AucunDossier } from "./_components/AucunDossier";
import { compareDateSignatureDecision } from "./_components/compareDateSignatureDecision";
import { Connexion } from "./_components/Connexion";
import DossiersTable from "./_components/DossiersTable";
import { getDossier } from "./_components/getDossier";
import { getPageTitle } from "./_components/getPageTitle";
import { getSearchParams, SearchParams } from "./_components/getParams";

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

  const dossiersSubventionResult = await Promise.all(dossierRequests);
  const dossiersSubvention = dossiersSubventionResult
    .filter((dossier) => dossier.success)
    .map((dossier) => dossier.data)
    .sort(compareDateSignatureDecision);

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
        <DossiersTable dossiers={dossiersSubvention} />
      )}

      {dossiersSubvention.length > 0 && (
        <p className="max-w-lg text-sm my-6">
          Vous ne trouvez pas votre dossier ? {noResultMsg}
        </p>
      )}
    </>
  );
}
