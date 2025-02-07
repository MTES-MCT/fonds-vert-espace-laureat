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
  intitule?: string;
  resume?: string;
  montantSubventionAttribuee?: number;
  impact?: Impact;
  nocache: boolean;
}) {
  return (
    <div className="w-full">
      <div className="mb-8 border px-6 py-4">
        <h2 className="mb-2">Impact du projet</h2>
        {dossierFondsVertResult.success ? (
          <ImpactDetails
            numeroDossier={numeroDossier}
            impact={impact}
            metriques={dossierFondsVertResult.data.demarche_specifique}
            nocache={nocache}
          />
        ) : (
          <>
            <p className="text-xs">{dossierFondsVertResult.error}</p>
            <ImpactDetails
              numeroDossier={numeroDossier}
              impact={impact}
              metriques={{}}
              nocache={nocache}
            />
          </>
        )}
      </div>

      {montantSubventionAttribuee && (
        <div className="mb-8 border px-6 py-4">
          <>
            <h2 className="mb-2">Subvention attribuée</h2>
            <SubventionDetails
              montantSubventionAttribuee={montantSubventionAttribuee}
            />
          </>
        </div>
      )}
    </div>
  );
}
