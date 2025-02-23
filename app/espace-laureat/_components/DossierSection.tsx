import Link from "next/link";

import { ImpactDetails } from "@/app/espace-laureat/_components/dossier-section/details/ImpactDetails";
import { SubventionDetails } from "@/app/espace-laureat/_components/dossier-section/details/SubventionDetails";
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

  const { errorMessage, metriques, informationFinanciere } =
    dossierFondsVertResult.success
      ? {
          errorMessage: null,
          metriques: dossierFondsVertResult.data.demarche_specifique,
          informationFinanciere:
            dossierFondsVertResult.data.information_financiere,
        }
      : {
          errorMessage: dossierFondsVertResult.error,
          metriques: {},
          informationFinanciere: undefined,
        };

  return (
    <div className="flex flex-wrap items-start gap-8">
      <div className="flex-1 flex flex-col gap-y-10">
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
        <div>
          <div className="flex-1 p-4 sm:p-8 bg-white border border-gray-300 mb-4">
            <div className="flex justify-between items-end mb-3">
              <h2 className="mb-0">Subvention</h2>
              {informationFinanciere && (
                <div className="text-xs text-gray-400 font-medium">
                  Chorus n°
                  {informationFinanciere.centre_financier_chorus}
                </div>
              )}
            </div>
            <SubventionDetails
              montantSubventionAttribuee={subvention.montantSubventionAttribuee}
              informationFinanciere={informationFinanciere}
            />
          </div>
          {errorMessage && (
            <p className="text-xs text-gray-500 font-medium">{errorMessage}</p>
          )}
          <Link
            className="fr-btn fr-btn--tertiary bg-white xl:mb-20"
            href={`/espace-laureat${dossierSubvention.numero.toString().startsWith("12345") ? "/demo" : ""}#dossier-${dossierSubvention.numero}`}
          >
            Retour
          </Link>
        </div>
      </div>
      <div className="p-6 pt-10 bg-white shadow-lg max-w-lg xl:w-96 sticky top-8 text-center text-balance">
        <p className="text-2xl font-semibold mb-2 text-gray-900">
          Les données de votre projet participent à la transition écologique
        </p>
        <ImpactDetails
          numeroDossier={dossierSubvention.numero}
          impact={impact}
          metriques={metriques}
          nocache={nocache}
        />
      </div>
    </div>
  );
}
