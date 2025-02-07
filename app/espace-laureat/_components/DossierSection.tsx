import { Details } from "@/app/espace-laureat/_components/dossier-section/Details";
import { Summary } from "@/app/espace-laureat/_components/dossier-section/Summary";
import { Impact } from "@/services/ds/impact";
import { Dossier } from "@/services/ds/subvention";

export async function DossierSection({
  dossier,
  impact,
}: {
  dossier: Dossier;
  impact?: Impact;
}) {
  return (
    <div className="flex flex-col gap-y-8" id={`dossier-${dossier.numero}`}>
      <Summary
        intitule={dossier.champs.intituleProjet}
        resume={dossier.champs.resumeProjet}
        titreDemarche={dossier.demarche.title}
        numeroDossierDemarchesSimplifiees={dossier.numero}
        numeroDossierAgenceEau={dossier.champs.numeroDossierAgenceEau}
        emailRepresentantLegal={dossier.champs.emailRepresentantLegal}
        emailResponsableSuivi={dossier.champs.emailResponsableSuivi}
        departementImplantation={dossier.champs.departementImplantation}
      />
      <Details
        numeroDossier={dossier.numero}
        montantSubventionAttribuee={dossier.champs.montantSubventionAttribuee}
        impact={impact}
      />
    </div>
  );
}
