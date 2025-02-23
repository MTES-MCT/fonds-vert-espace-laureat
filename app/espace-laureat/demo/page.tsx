import { DossierSection } from "@/app/espace-laureat/_components/DossierSection";
import { demoDossier1 } from "@/utils/demo";

export default async function EspaceLaureatDemo() {
  const dossiers = [demoDossier1];

  return (
    <>
      <h1 className="flex justify-between items-end">
        Dossiers acceptés{" "}
        <div className="uppercase text-sm font-bold text-gray-400">
          Page de démonstration
        </div>
      </h1>
      <div className="flex flex-col gap-y-8">
        {dossiers.map((dossier, index) => (
          <DossierSection
            isAdmin={false}
            key={index}
            dossierSubvention={dossier}
            dossierFondsVertResult={{ success: false, error: "" }}
            nocache={false}
          />
        ))}{" "}
      </div>
    </>
  );
}
