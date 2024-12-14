import { ProjetSection } from "@/app/projets/_components/ProjetSection";
import { departements } from "@/data/departements";
import { projetsGroupes } from "@/utils/projets";
import { Projet } from "@/utils/projets/projet";

export function generateStaticParams() {
  return Object.entries(departements).map(([code]) => {
    return {
      codeDepartement: code,
    };
  });
}

export default async function ProjetsDepartement({
  params,
}: {
  params: Promise<{ year: number; codeDepartement: string }>;
}) {
  const { year, codeDepartement } = await params;

  if (!projetsGroupes[year]) {
    return <h1>Aucune donnée pour {year}</h1>;
  }

  const projetsParDemarche = projetsGroupes[year][codeDepartement];

  if (!projetsParDemarche) {
    return <h1>Région introuvable</h1>;
  }

  return (
    <div>
      <h1>{departements[codeDepartement]}</h1>
      {Object.entries(projetsParDemarche)?.map(([, demarche]) => {
        return (
          <>
            <h2>{demarche.demarche_title}</h2>
            <ul className="list-none flex flex-wrap p-0 gap-6">
              {demarche?.projets?.map((projet: Projet, index: number) => (
                <ProjetSection key={index.toString()} projet={projet} />
              ))}
            </ul>
          </>
        );
      })}
    </div>
  );
}
