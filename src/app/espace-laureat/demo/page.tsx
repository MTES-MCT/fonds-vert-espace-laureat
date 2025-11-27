import { DossierSection } from "@/app/espace-laureat/_components/DossierSection";
import { StartDsfrOnHydration } from "@/components/dsfr";
import {
  demoDossier1,
  demoDossierFondsVert,
  demoFinancesEJ1,
  demoFinancesEJ2,
} from "@/utils/demo";

export default async function EspaceLaureatDemo() {
  const dossiers = [demoDossier1];

  const financesEJMap = {
    [demoFinancesEJ1.numero_ej]: demoFinancesEJ1,
    [demoFinancesEJ2.numero_ej]: demoFinancesEJ2,
  };

  return (
    <>
      <StartDsfrOnHydration />
      <div className="flex flex-col gap-y-8">
        {dossiers.map((dossier, index) => (
          <DossierSection
            isAdmin={false}
            key={index}
            dossierSubvention={dossier}
            dossierFondsVertResult={{
              success: true,
              data: demoDossierFondsVert,
            }}
            financesEJMap={financesEJMap}
            nocache={false}
          />
        ))}
      </div>
    </>
  );
}
