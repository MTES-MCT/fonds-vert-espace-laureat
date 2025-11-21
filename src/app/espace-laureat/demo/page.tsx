import { DossierSection } from "@/app/espace-laureat/_components/DossierSection";
import { demoDossier1, demoDossierFondsVert } from "@/utils/demo";

export default async function EspaceLaureatDemo() {
  const dossiers = [demoDossier1];

  return (
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
          nocache={false}
        />
      ))}
    </div>
  );
}
