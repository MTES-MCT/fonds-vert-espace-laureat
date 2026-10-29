import Alert from "@codegouvfr/react-dsfr/Alert";

import { AucunDossier } from "@/app/projets/_components/AucunDossier";
import { compareDateSignatureDecision } from "@/app/projets/_components/compareDateSignatureDecision";
import DossiersTable from "@/app/projets/_components/DossiersTable";
import { getPageTitle } from "@/app/projets/_components/getPageTitle";
import {
  getSearchParams,
  SearchParams,
} from "@/app/projets/_components/getParams";
import { loadAuthorizedDossiers } from "@/app/projets/_components/loadAuthorizedDossiers";
import { getAllDossierNumbers } from "@/services/fondsvert/dossiers";
import { isAdmin } from "@/utils/roles";
import { getAuthenticatedUser, getSession } from "@/utils/session";

export default async function Projets({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getAuthenticatedUser();
  const admin = isAdmin({ userEmail: user.email });
  const session = await getSession();

  const params = await getSearchParams({ searchParams });
  const siret = params.siret ?? user.siret;

  const dossierNumbersResult = await getAllDossierNumbers({
    siret,
    email: user.email,
    global: admin,
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

  const authorized = await loadAuthorizedDossiers({
    dossierNumbers: dossierNumbersResult.data,
    userEmail: user.email,
  });
  const dossiersSubvention = authorized.dossiers.sort(
    compareDateSignatureDecision,
  );
  const view = admin
    ? (session.projectView ?? "porteur")
    : dossiersSubvention.find((dossier) => dossier.viewerRelationship)
        ?.viewerRelationship;
  const partial =
    dossierNumbersResult.completeness === "partial" ||
    authorized.unavailableCount > 0;

  const noResultMsg =
    "Assurez-vous de vous connecter avec l'adresse e-mail utilisée lors du dépôt de votre demande de subvention. Si vous avez besoin d'aide, n'hésitez pas à nous contacter.";

  return (
    <div className="fr-container my-8">
      <div className="bg-white px-8 pt-6 pb-2 shadow-sm">
        <h1>{getPageTitle(view)}</h1>

        {partial && (
          <Alert
            severity="warning"
            small
            className="mb-6"
            description="La liste des projets est incomplète : certaines données n’ont pas pu être chargées. Réessayez pour actualiser la liste."
          />
        )}

        {dossiersSubvention.length === 0 && !partial ? (
          <AucunDossier
            siret={siret}
            email={user.email}
            noResultMsg={noResultMsg}
          />
        ) : dossiersSubvention.length > 0 ? (
          <DossiersTable dossiers={dossiersSubvention} />
        ) : null}

        {dossiersSubvention.length > 0 && (
          <p className="my-6 max-w-lg text-sm">
            Vous ne trouvez pas votre projet ? {noResultMsg}
          </p>
        )}
      </div>
    </div>
  );
}
