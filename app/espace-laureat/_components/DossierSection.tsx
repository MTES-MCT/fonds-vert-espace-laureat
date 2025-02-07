import { Details } from "@/app/espace-laureat/_components/dossier-section/Details";
import { Summary } from "@/app/espace-laureat/_components/dossier-section/Summary";
import { Impact } from "@/services/ds/impact";
import { Dossier } from "@/services/ds/subvention";
import { DossierFondsVert } from "@/services/fondsvert/dossier";

export async function DossierSection({
  dossierSubvention,
  dossierFondsVertResult,
  impact,
  nocache,
}: {
  dossierSubvention: Dossier;
  dossierFondsVertResult:
    | { success: false; error: string }
    | { success: true; data: DossierFondsVert };
  impact?: Impact;
  nocache: boolean;
}) {
  const subvention = dossierSubvention.champs;

  return (
    <div
      className="flex flex-col gap-y-8"
      id={`dossier-${dossierSubvention.numero}`}
    >
      <Summary
        intitule={subvention.intituleProjet}
        resume={subvention.resumeProjet}
        titreDemarche={dossierSubvention.demarche.title}
        numeroDossierDemarchesSimplifiees={dossierSubvention.numero}
        numeroDossierAgenceEau={subvention.numeroDossierAgenceEau}
        emailRepresentantLegal={subvention.emailRepresentantLegal}
        emailResponsableSuivi={subvention.emailResponsableSuivi}
        departementImplantation={subvention.departementImplantation}
      />
      <Details
        numeroDossier={dossierSubvention.numero}
        dossierFondsVertResult={dossierFondsVertResult}
        montantSubventionAttribuee={subvention.montantSubventionAttribuee}
        impact={impact}
        nocache={nocache}
      />
    </div>
  );
}
