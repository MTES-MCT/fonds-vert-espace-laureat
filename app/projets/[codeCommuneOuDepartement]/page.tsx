import { ProjetSection } from "@/app/projets/_components/ProjetSection";
import {
  communeEtDepartements,
  Projets,
  projetsGroupes,
  ProjetsParDemarches,
} from "@/utils/projets";
import { Projet } from "@/utils/projets/projet";

export default async function ProjetsDepartement({
  params,
}: {
  params: Promise<{ codeCommuneOuDepartement: string }>;
}) {
  const { codeCommuneOuDepartement: code } = await params;

  if (!projetsGroupes[code]) {
    return <h1>Commune introuvable</h1>;
  }

  const projetsParDemarches2023 = projetsGroupes[code][2023];
  const projetsParDemarches2024 = projetsGroupes[code][2024];

  return (
    <div>
      <h1 className="mb-4">{communeEtDepartements[code]}</h1>
      <div className="fr-tabs">
        <ul
          className="fr-tabs__list"
          role="tablist"
          aria-label="Projets par année"
        >
          <ViewTabLink selected={true} annee={2024} />
          <ViewTabLink selected={false} annee={2023} />
        </ul>
        <ViewProjetsParDemarches
          selected={true}
          annee={2024}
          projetsParDemarches={projetsParDemarches2024}
        />
        <ViewProjetsParDemarches
          selected={false}
          annee={2023}
          projetsParDemarches={projetsParDemarches2023}
        />
      </div>
    </div>
  );
}

function ViewTabLink({
  selected,
  annee,
}: {
  selected: boolean;
  annee: number;
}) {
  return (
    <li role="presentation">
      <button
        id={`tabpanel-${annee}`}
        className="fr-tabs__tab fr-icon-trophy-line fr-tabs__tab--icon-left"
        tabIndex={selected ? 0 : -1}
        role="tab"
        aria-selected={selected ? true : false}
        aria-controls={`tabpanel-${annee}-panel`}
      >
        Lauréats {annee}
      </button>
    </li>
  );
}

function ViewProjetsParDemarches({
  selected,
  annee,
  projetsParDemarches,
}: {
  selected: boolean;
  annee: number;
  projetsParDemarches: ProjetsParDemarches;
}) {
  if (!projetsParDemarches) {
    return <></>;
  }

  return (
    <div
      id={`tabpanel-${annee}-panel`}
      className={`fr-tabs__panel ${selected ? "fr-tabs__panel--selected" : ""}`}
      role="tabpanel"
      aria-labelledby={`tabpanel-${annee}`}
      tabIndex={0}
    >
      <ul className="flex flex-wrap justify-start items-end gap-y-12 gap-x-8 bg-gray-100 list-none p-10 mt-0 mb-24">
        {projetsParDemarches?.map((projets: Projets, index: number) => (
          <ViewProjets key={index.toString()} projets={projets} />
        ))}
      </ul>
    </div>
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
