import { ProjetSection } from "@/app/projets/_components/ProjetSection";
import { Projets, ProjetsParDemarches } from "@/utils/projets";
import { Projet } from "@/utils/projets/projet";

export function ProjetsPanel({
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
      <ul className="flex flex-wrap justify-start items-end gap-y-8 gap-x-8 list-none p-0 m-0">
        {projetsParDemarches?.map((projets: Projets, index: number) => (
          <DemarcheProjets key={index.toString()} projets={projets} />
        ))}
      </ul>
    </div>
  );
}

function DemarcheProjets({ key, projets }: { key: string; projets: Projets }) {
  return (
    <li key={key} className="p-10 mt-0 w-full bg-gray-100">
      <h2 className="mt-0 mb-5 leading-tight text-xl text-balance font-semibold">
        {projets.demarche_title}
      </h2>
      <ul className="list-none flex flex-wrap p-0 m-0 gap-8">
        {projets.projets.map((projet: Projet, index: number) => (
          <ProjetSection key={index.toString()} projet={projet} />
        ))}
      </ul>
    </li>
  );
}
