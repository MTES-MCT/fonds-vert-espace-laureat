import Alert from "@codegouvfr/react-dsfr/Alert";
import { redirect } from "next/navigation";

import { Juridique } from "@/app/espace-laureat/_components/Juridique";
import { Profil } from "@/app/espace-laureat/_components/Profil";
import { Projet } from "@/app/espace-laureat/_components/Projet";
import {
  demoStaticDossierNumber,
  getDemoDossierNumber,
  getDemoStaticDossierResponse,
} from "@/utils/demo";
import { getSession } from "@/utils/session";

import { getDossier } from "./_components/getDossier";

export default async function EspaceLaureat() {
  const session = await getSession();
  const user = session?.user;

  const demoDossierNumber = getDemoDossierNumber();

  if (!user || !user.email || !user.email_verified) {
    return redirect("/connexion");
  }

  const dossierResult =
    demoDossierNumber === demoStaticDossierNumber
      ? getDemoStaticDossierResponse()
      : await getDossier(demoDossierNumber);

  if (!dossierResult.success) {
    return (
      <div className="max-w-xl">
        <Alert
          title="Impossible d'afficher ce dossier"
          description={dossierResult.error}
          severity="error"
        />
      </div>
    );
  }

  const dossier = dossierResult.data;
  const mesureFondsVert = dossier.demarche.title.replace("FONDS VERT - ", "");

  return (
    <>
      <h1>{mesureFondsVert}</h1>
      <div className="grid lg:grid-cols-2 gap-8 mb-24">
        <Juridique
          dateTraitement={dossier.dateTraitement}
          dateSignatureDecision={dossier.champs.dateSignatureDecision}
          montantSubventionAttribuee={dossier.champs.montantSubventionAttribuee}
          numeroDossierDemarchesSimplifiees={dossier.numero}
          numeroDossierAgenceEau={dossier.champs.numeroDossierAgenceEau}
          numeroEngagementJuridique={dossier.champs.numeroEngagementJuridique}
          autresNumerosEngagementJuridique={
            dossier.champs.autresNumerosEngagementJuridique
          }
        />{" "}
        <Projet
          intitule={dossier.champs.intituleProjet}
          resume={dossier.champs.resumeProjet}
          departementImplantation={dossier.champs.departementImplantation}
          montantSubventionAttribuee={dossier.champs.montantSubventionAttribuee}
        />
        <Profil
          siret={dossier.demandeur.siret}
          emailRepresentantLegal={dossier.champs.emailRepresentantLegal}
          emailResponsableSuivi={dossier.champs.emailResponsableSuivi}
        />
      </div>
    </>
  );
}
