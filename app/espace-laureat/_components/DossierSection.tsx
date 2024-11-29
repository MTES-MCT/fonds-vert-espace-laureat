import { Subvention } from "@/app/espace-laureat/_components/dossier-section/Subvention";
import { Summary } from "@/app/espace-laureat/_components/dossier-section/Summary";
import { Dossier } from "@/utils/dossier";

export async function DossierSection({ dossier }: { dossier: Dossier }) {
  return (
    <div
      className="grid lg:grid-cols-2 gap-y-6 border py-6"
      id={`dossier-${dossier.numero}`}
    >
      <Summary
        titreDemarche={dossier.demarche.title}
        dateTraitement={dossier.dateTraitement}
        dateSignatureDecision={dossier.champs.dateSignatureDecision}
        montantSubventionAttribuee={dossier.champs.montantSubventionAttribuee}
        numeroDossierDemarchesSimplifiees={dossier.numero}
        emailRepresentantLegal={dossier.champs.emailRepresentantLegal}
        emailResponsableSuivi={dossier.champs.emailResponsableSuivi}
      />
      <Subvention
        dossierNumero={dossier.numero}
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
