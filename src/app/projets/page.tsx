import Alert from "@codegouvfr/react-dsfr/Alert";

import { AucunDossier } from "@/app/projets/_components/AucunDossier";
import { compareDateSignatureDecision } from "@/app/projets/_components/compareDateSignatureDecision";
import DossiersTable from "@/app/projets/_components/DossiersTable";
import {
  getSearchParams,
  SearchParams,
} from "@/app/projets/_components/getParams";
import { loadAuthorizedDossiers } from "@/app/projets/_components/loadAuthorizedDossiers";
import { StartDsfrOnHydration } from "@/components/dsfr";
import { getDossiersProgress } from "@/db/dossierProgress";
import { getAllDossierNumbers } from "@/services/fondsvert/dossiers";
import { projectListLabel } from "@/utils/projectView";
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
      <>
        <StartDsfrOnHydration />
        <Alert
          severity="error"
          className="max-w-xl bg-white"
          small
          description={dossierNumbersResult.error}
        />
      </>
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
    ? (session?.projectView ?? "porteur")
    : dossiersSubvention.find((dossier) => dossier.viewerRelationship)
        ?.viewerRelationship;
  const progress =
    view === "instructeur"
      ? await getDossiersProgress({
          dossierNumbers: dossiersSubvention.map((dossier) => dossier.numero),
        })
      : {};
  const partial =
    dossierNumbersResult.completeness === "partial" ||
    authorized.unavailableCount > 0;

  const accessAdvice =
    view === "porteur"
      ? "Assurez-vous de vous connecter avec l'adresse e-mail utilisée lors du dépôt de votre demande de subvention."
      : view === "instructeur"
        ? "Assurez-vous de vous connecter avec l'adresse e-mail associée à votre groupe instructeur dans Démarche numérique."
        : "Assurez-vous de vous connecter avec une adresse e-mail disposant d'un accès au projet dans Démarche numérique.";
  const noResultMsg = `${accessAdvice} Si vous avez besoin d'aide, n'hésitez pas à nous contacter.`;

  return (
    <div className="fr-container my-8">
      <StartDsfrOnHydration />
      <div className="min-h-[60svh] bg-white p-4 sm:p-8">
        <h1>{projectListLabel(view)}</h1>

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
          <DossiersTable
            dossiers={dossiersSubvention}
            view={view}
            summaries={dossierNumbersResult.summaries}
            progress={progress}
          />
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
