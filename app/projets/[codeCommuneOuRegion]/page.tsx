import { ProjetSection } from "@/app/projets/_components/ProjetSection";
import { departements } from "@/data/departements";
import { Projets, projetsGroupes, ProjetsParDemarches } from "@/utils/projets";
import { Projet } from "@/utils/projets/projet";

export function generateStaticParams() {
  return Object.entries(departements).map(([code]) => {
    return {
      codeCommuneOuRegion: code,
    };
  });
}

export default async function ProjetsDepartement({
  params,
}: {
  params: Promise<{ codeCommuneOuRegion: string }>;
}) {
  const { codeCommuneOuRegion: code } = await params;

  if (!projetsGroupes[code]) {
    return <h1>Commune introuvable</h1>;
  }

  const projetsParDemarches2023 = projetsGroupes[code][2023];
  const projetsParDemarches2024 = projetsGroupes[code][2024];

  return (
    <div>
      <h1 className="mb-4">
        <div className="text-xs font-normal text-gray-400">{code}</div>
        {code}
      </h1>
      <ViewProjetsParDemarches
        annee={2024}
        projetsParDemarches={projetsParDemarches2024}
      />
      <ViewProjetsParDemarches
        annee={2023}
        projetsParDemarches={projetsParDemarches2023}
      />
    </div>
  );
}

function ViewProjetsParDemarches({
  annee,
  projetsParDemarches,
}: {
  annee: number;
  projetsParDemarches: ProjetsParDemarches;
}) {
  if (!projetsParDemarches) {
    return <></>;
  }

  return (
    <>
      <div className="mb-3 font-semibold">{annee}</div>
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
