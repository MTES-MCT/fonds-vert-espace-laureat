import { DossierSection } from "@/app/espace-laureat/_components/DossierSection";
import { StartDsfrOnHydration } from "@/components/dsfr";
import { FinancesEJResult } from "@/services/fondsvert/finances";
import { resolveImpactStatus } from "@/services/impact/status";
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
        {dossiers.map((dossier, index) => {
          const impactStatus = resolveImpactStatus({
            dossierSubventionNumero: dossier.numero,
            dossiersImpact: [],
            dossierFondsVert: demoDossierFondsVert,
          });

          return (
            <DossierSection
              isAdmin={false}
              key={index}
              dossierSubvention={dossier}
              dossierFondsVertResult={{
                success: true,
                data: demoDossierFondsVert,
              }}
              financesEJPromise={financesEJPromise}
              impactStatus={impactStatus}
              nocache={false}
            />
          );
        })}
      </div>
    </>
  );
}
