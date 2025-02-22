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
    <div className="w-full">
      {errorMessage && <p className="text-xs">{errorMessage}</p>}
      <div className="mb-8 border px-6 py-4">
        <h2 className="mb-2">Impact du projet</h2>
        <ImpactDetails
          numeroDossier={numeroDossier}
          impact={impact}
          metriques={metriques}
          nocache={nocache}
        />
      </div>

      <div className="mb-8 border px-6 py-4">
        <h2 className="mb-2">Subvention attribuée</h2>
        <SubventionDetails
          montantSubventionAttribuee={montantSubventionAttribuee}
          informationFinanciere={informationFinanciere}
        />
      </div>
    </div>
  );
}
