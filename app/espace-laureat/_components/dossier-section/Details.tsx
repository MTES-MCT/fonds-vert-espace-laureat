import { ImpactDetails } from "@/app/espace-laureat/_components/dossier-section/details/ImpactDetails";
import { SubventionDetails } from "@/app/espace-laureat/_components/dossier-section/details/SubventionDetails";
import { Impact } from "@/services/ds/impact";
import { getDossierFondsVert } from "@/services/fondsvert/dossier";

export async function Details({
  numeroDossier,
  montantSubventionAttribuee,
  impact,
}: {
  numeroDossier: number;
  intitule?: string;
  resume?: string;
  montantSubventionAttribuee?: number;
  impact?: Impact;
}) {
  const dossierFondsVertResult = await getDossierFondsVert({
    numeroDossier,
  });

  return (
    <div className="w-full">
      <div className="mb-8 border px-6 py-4">
        <h2 className="mb-2">Impact du projet</h2>
        {dossierFondsVertResult.success ? (
          <ImpactDetails
            impact={impact}
            metriques={dossierFondsVertResult.data.demarche_specifique}
          />
        ) : (
          <>
            <p className="text-xs">{dossierFondsVertResult.error}</p>
            <ImpactDetails impact={impact} metriques={{}} />
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
