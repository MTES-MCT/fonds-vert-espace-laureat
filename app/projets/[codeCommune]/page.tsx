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
  params: Promise<{ codeCommune: string }>;
}) {
  const { codeCommune } = await params;

  const projetsParDemarches = projetsGroupes[codeCommune];

  if (!projetsParDemarches) {
    return <h1>Commune introuvable</h1>;
  }

  return (
    <div>
      {<ViewProjetsParDemarches projetsParDemarches={projetsParDemarches} />}
    </div>
  );
}

function ViewProjetsParDemarches({
  projetsParDemarches,
}: {
  projetsParDemarches: ProjetsParDemarches;
}) {
  return (
    <>
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
    </>
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
