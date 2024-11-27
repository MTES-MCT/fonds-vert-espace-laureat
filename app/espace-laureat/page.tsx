import Alert from "@codegouvfr/react-dsfr/Alert";
import { redirect } from "next/navigation";

import { Juridique } from "@/app/espace-laureat/_components/Juridique";
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

  return (
    <>
      <h1>Projet lauréat</h1>
      <div className="grid lg:grid-cols-2 gap-y-6 mb-24 border py-6">
        <Juridique
          titreDemarche={dossier.demarche.title}
          dateTraitement={dossier.dateTraitement}
          dateSignatureDecision={dossier.champs.dateSignatureDecision}
          montantSubventionAttribuee={dossier.champs.montantSubventionAttribuee}
          numeroDossierDemarchesSimplifiees={dossier.numero}
          emailRepresentantLegal={dossier.champs.emailRepresentantLegal}
          emailResponsableSuivi={dossier.champs.emailResponsableSuivi}
        />
        <Projet
          intitule={dossier.champs.intituleProjet}
          resume={dossier.champs.resumeProjet}
          departementImplantation={dossier.champs.departementImplantation}
          numeroDossierAgenceEau={dossier.champs.numeroDossierAgenceEau}
          numeroEngagementJuridique={dossier.champs.numeroEngagementJuridique}
          autresNumerosEngagementJuridique={
            dossier.champs.autresNumerosEngagementJuridique
          }
          montantSubventionAttribuee={dossier.champs.montantSubventionAttribuee}
        />
      </div>
    </>
  );
}
