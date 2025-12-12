import Alert from "@codegouvfr/react-dsfr/Alert";

import { getAllDossierNumbers } from "@/services/fondsvert/dossiers";
import { getAuthenticatedUser } from "@/utils/session";

import { AucunDossier } from "../_components/AucunDossier";
import { compareDateSignatureDecision } from "../_components/compareDateSignatureDecision";
import DossiersTable from "../_components/DossiersTable";
import { getDossier } from "../_components/getDossier";
import { getPageTitle } from "../_components/getPageTitle";
import { getSearchParams, SearchParams } from "../_components/getParams";

export default async function EspaceLaureat({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getAuthenticatedUser();

  const params = await getSearchParams({ searchParams });
  const siret = params.siret ?? user.siret;

  const dossierNumbersResult = await getAllDossierNumbers({
    siret,
    email: user.email,
  });

  if (!dossierNumbersResult.success) {
    return (
      <Alert
        severity="error"
        className="max-w-xl bg-white"
        small
        description={dossierNumbersResult.error}
      />
    );
  }

  const dossierNumbers = dossierNumbersResult.data;

  const dossierRequests = dossierNumbers.map((dossierNumber) =>
    getDossier({ numeroDossier: dossierNumber, userEmail: user.email }),
  );

  const dossiersSubventionResult = await Promise.all(dossierRequests);
  const dossiersSubvention = dossiersSubventionResult
    .filter((dossier) => dossier.success)
    .map((dossier) => dossier.data)
    .sort(compareDateSignatureDecision);

  const noResultMsg =
    "Assurez-vous de vous connecter avec l'adresse e-mail utilisée lors du dépôt de votre demande de subvention. Si vous avez besoin d'aide, n'hésitez pas à nous contacter.";

  return (
    <div className="fr-container my-8">
      <div className="bg-white px-8 pt-6 pb-2 shadow-sm">
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
          <p className="my-6 max-w-lg text-sm">
            Vous ne trouvez pas votre dossier ? {noResultMsg}
          </p>
        )}
      </div>
    </div>
  );
}
