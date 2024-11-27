import Alert from "@codegouvfr/react-dsfr/Alert";

import { getDossier } from "@/app/espace-laureat/_components/getDossier";
import { Dossier } from "@/app/espace-laureat/_components/projet/Dossier";
import { Subvention } from "@/app/espace-laureat/_components/projet/Subvention";
import {
  demoStaticDossierNumber,
  getDemoStaticDossierResponse,
} from "@/utils/demo";

export async function Projet({ dossierNumber }: { dossierNumber: number }) {
  const dossierResult =
    dossierNumber === demoStaticDossierNumber
      ? getDemoStaticDossierResponse()
      : await getDossier(dossierNumber);

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
    <div className="grid lg:grid-cols-2 gap-y-6 border py-6">
      <Dossier
        titreDemarche={dossier.demarche.title}
        dateTraitement={dossier.dateTraitement}
        dateSignatureDecision={dossier.champs.dateSignatureDecision}
        montantSubventionAttribuee={dossier.champs.montantSubventionAttribuee}
        numeroDossierDemarchesSimplifiees={dossier.numero}
        emailRepresentantLegal={dossier.champs.emailRepresentantLegal}
        emailResponsableSuivi={dossier.champs.emailResponsableSuivi}
      />
      <Subvention
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
  );
}
