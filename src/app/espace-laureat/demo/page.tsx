import { DossierSection } from "@/app/espace-laureat/_components/DossierSection";
import { FinancesEJResult } from "@/app/espace-laureat/[dossierNumber]/page";
import { StartDsfrOnHydration } from "@/components/dsfr";
import {
  demoDossier1,
  demoDossierFondsVert,
  demoFinancesEJ1,
  demoFinancesEJ2,
} from "@/utils/demo";

export default async function EspaceLaureatDemo() {
  const dossiers = [demoDossier1];

  const financesEJResult: FinancesEJResult = {
    [demoFinancesEJ1.numero_ej]: { success: true, data: demoFinancesEJ1 },
    [demoFinancesEJ2.numero_ej]: { success: true, data: demoFinancesEJ2 },
  };

  const financesEJPromise = Promise.resolve(financesEJResult);

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
            financesEJPromise={financesEJPromise}
            nocache={false}
          />
        ))}
      </div>
    </>
  );
}
