import { ProjetSection } from "@/app/projets/_components/ProjetSection";
import { Projet, projetsParRegion } from "@/utils/projets";

export function generateStaticParams() {
  return [
    1, 2, 3, 4, 6, 11, 24, 27, 28, 32, 44, 52, 53, 75, 76, 84, 93, 94,
  ].map((codeRegion) => {
    return {
      codeRegion: codeRegion.toString(),
    };
  });
}

export const revalidate = 3600;

export default async function ProjetsRegion({
  params,
}: {
  params: Promise<{ codeRegion: string }>;
}) {
  const { codeRegion } = await params;
  const groupe = projetsParRegion[codeRegion];

  if (!groupe) {
    return <h1>Région introuvable</h1>;
  }

  return (
    <div>
      {Object.entries(groupe)?.map(([key, demarche]) => {
        return (
          <>
            <h2>{demarche.demarche_title}</h2>
            <ul className="list-none flex flex-wrap gap-2">
              {demarche?.projets?.map((projet: Projet, index: number) => (
                <ProjetSection key={index} projet={projet} />
              ))}
            </ul>
          </>
        );
      })}
    </div>
  );
}
