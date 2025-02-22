import { ImpactDetails } from "@/app/espace-laureat/_components/dossier-section/details/ImpactDetails";
import { SubventionDetails } from "@/app/espace-laureat/_components/dossier-section/details/SubventionDetails";
import { Impact } from "@/services/ds/impact";
import { DossierFondsVert } from "@/services/fondsvert/dossier";

export async function Details({
  numeroDossier,
  dossierFondsVertResult,
  montantSubventionAttribuee,
  impact,
  nocache,
}: {
  numeroDossier: number;
  dossierFondsVertResult:
    | { success: false; error: string }
    | { success: true; data: DossierFondsVert };
  montantSubventionAttribuee?: number;
  impact?: Impact;
  nocache: boolean;
}) {
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
    <>
      <div className="flex flex-wrap items-start">
        <div className="flex-1 p-8 bg-white border border-gray-300">
          <div className="flex justify-between">
            <h2 className="mb-2 leading-none">Subvention attribuée</h2>
            {informationFinanciere && (
              <div className="text-xs text-gray-400 font-medium">
                Chorus n°
                {informationFinanciere.centre_financier_chorus}
              </div>
            )}
          </div>
          <SubventionDetails
            montantSubventionAttribuee={montantSubventionAttribuee}
            informationFinanciere={informationFinanciere}
          />
        </div>

        <div className="p-6 pt-10 bg-white shadow-lg w-96 ml-8 sticky top-12 text-center text-balance">
          <p className="text-2xl font-semibold mb-2 text-gray-900">
            Les données de votre projet participent à la transition écologique
          </p>
          <ImpactDetails
            numeroDossier={numeroDossier}
            impact={impact}
            metriques={metriques}
            nocache={nocache}
          />
        </div>
      </div>
      {errorMessage && <p className="text-xs">{errorMessage}</p>}
    </>
  );
}
