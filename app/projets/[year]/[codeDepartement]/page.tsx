import { ProjetSection } from "@/app/projets/_components/ProjetSection";
import { departements } from "@/data/departements";
import { Projets, projetsGroupes, ProjetsParDemarches } from "@/utils/projets";
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

  const projetsParDemarchesCommunes = projetsGroupes[year][codeDepartement];

  if (!projetsParDemarchesCommunes) {
    return <h1>Département introuvable</h1>;
  }

  return (
    <div>
      <h1>{departements[codeDepartement]}</h1>
      <ul className="list-none p-0">
        {projetsParDemarchesCommunes.map(
          (projetsParDemarches: ProjetsParDemarches, index) => {
            return (
              <ViewProjetsParDemarches
                key={index.toString()}
                projetsParDemarches={projetsParDemarches}
              />
            );
          },
        )}
      </ul>
    </div>
  );
}

function ViewProjetsParDemarches({
  key,
  projetsParDemarches,
}: {
  key: string;
  projetsParDemarches: ProjetsParDemarches;
}) {
  return (
    <li key={key}>
      <h2 className="mb-4">
        <div className="text-xs font-normal text-gray-400">
          {projetsParDemarches[0].code_commune}
        </div>
        {projetsParDemarches[0].nom_commune}
      </h2>
      <ul className="flex flex-wrap justify-start items-end gap-y-12 gap-x-8 bg-gray-100 list-none p-10 mb-24">
        {projetsParDemarches?.map((projets: Projets, index: number) => (
          <ViewProjets key={index.toString()} projets={projets} />
        ))}
      </ul>
    </li>
  );
}

function ViewProjets({ key, projets }: { key: string; projets: Projets }) {
  return (
    <li key={key} className="p-0 m-0">
      <h3 className="w-80 mt-0 mb-5 leading-tight text-base text-balance font-medium">
        {projets.demarche_title}
      </h3>
      <ul className="list-none flex flex-wrap p-0 m-0 gap-8">
        {projets.projets.map((projet: Projet, index: number) => (
          <ProjetSection key={index.toString()} projet={projet} />
        ))}
      </ul>
    </li>
  );
}
