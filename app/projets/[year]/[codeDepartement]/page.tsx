import { ProjetSection } from "@/app/projets/_components/ProjetSection";
import { departements } from "@/data/departements";
import { Projets, projetsGroupes, ProjetsParCommunes } from "@/utils/projets";
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
          (projetsParCommunes: ProjetsParCommunes, index) => {
            return (
              <ViewProjetsParCommunes
                key={index.toString()}
                projetsParCommunes={projetsParCommunes}
              />
            );
          },
        )}
      </ul>
    </div>
  );
}

function ViewProjetsParCommunes({
  key,
  projetsParCommunes,
}: {
  key: string;
  projetsParCommunes: ProjetsParCommunes;
}) {
  return (
    <li key={key}>
      <h2 className="sticky top-0 border-b border-t border-gray-900  bg-white py-4">
        <div className="text-balance max-w-3xl">
          {projetsParCommunes[0].demarche_title}
        </div>
      </h2>
      <ul className="flex flex-wrap gap-6 list-none p-0">
        {projetsParCommunes?.map((projets: Projets, index: number) => (
          <ViewProjets key={index.toString()} projets={projets} />
        ))}
      </ul>
    </li>
  );
}

function ViewProjets({ key, projets }: { key: string; projets: Projets }) {
  return (
    <li key={key} className="border-gray-200 mb-8">
      <h3 className="text-base mb-3">
        <div className="text-xs font-normal text-gray-400">
          {projets.code_commune}
        </div>
        <div>{projets.nom_commune}</div>
      </h3>
      <ul className="list-none flex flex-wrap p-0 m-0 gap-6">
        {projets.projets.map((projet: Projet, index: number) => (
          <ProjetSection key={index.toString()} projet={projet} />
        ))}
      </ul>
    </li>
  );
}
