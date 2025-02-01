import { Details } from "@/app/espace-laureat/_components/dossier-section/Details";
import { Summary } from "@/app/espace-laureat/_components/dossier-section/Summary";
import { Impact } from "@/services/ds/impact";
import { Dossier } from "@/services/ds/subvention";
import { getDossierFondsVert } from "@/services/fondsvert/dossier";

export async function DossierSection({
  dossier,
  impact,
}: {
  dossier: Dossier;
  impact?: Impact;
}) {
  const dossierFondsVertResult = await getDossierFondsVert({
    dossierNumber: dossier.numero,
  });

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
      <Details
        intitule={dossier.champs.intituleProjet}
        resume={dossier.champs.resumeProjet}
        departementImplantation={dossier.champs.departementImplantation}
        numeroDossierAgenceEau={dossier.champs.numeroDossierAgenceEau}
        numeroEngagementJuridique={dossier.champs.numeroEngagementJuridique}
        autresNumerosEngagementJuridique={
          dossier.champs.autresNumerosEngagementJuridique
        }
        montantSubventionAttribuee={dossier.champs.montantSubventionAttribuee}
        impact={impact}
      />
      <p>
        {dossierFondsVertResult.success
          ? `${Object.keys(dossierFondsVertResult.data.demarche_specifique).length} metriques disponibles`
          : dossierFondsVertResult.error}
      </p>
    </div>
  );
}
