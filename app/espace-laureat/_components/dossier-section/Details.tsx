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
    <div className="max-w-3xl">
      {errorMessage && <p className="text-xs">{errorMessage}</p>}

      <div className="mb-8 px-10 py-8 bg-white border">
        <h2 className="mb-2">Impact du projet</h2>
        <ImpactDetails
          numeroDossier={numeroDossier}
          impact={impact}
          metriques={metriques}
          nocache={nocache}
        />
      </div>

      <div className="mb-8 px-10 py-8 bg-white border">
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
    </div>
  );
}
