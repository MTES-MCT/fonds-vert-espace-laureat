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
  return (
    <div
      id={`tabpanel-${annee}-panel`}
      className={`fr-tabs__panel ${selected ? "fr-tabs__panel--selected" : ""}`}
      role="tabpanel"
      aria-labelledby={`tabpanel-${annee}`}
      tabIndex={0}
    >
      {projetsParDemarches ? (
        <ul className="m-0 flex list-none flex-wrap items-end justify-start gap-x-8 gap-y-8 p-0">
          {projetsParDemarches?.map((projets: Projets, index: number) => (
            <DemarcheProjets key={index.toString()} projets={projets} />
          ))}
        </ul>
      ) : (
        <div className="p-12 text-lg">Aucun projet sur cette année</div>
      )}
    </div>
  );
}

function DemarcheProjets({ key, projets }: { key: string; projets: Projets }) {
  return (
    <li key={key} className="mt-0 w-full bg-gray-100 p-10">
      <h2 className="mt-0 mb-5 text-xl leading-tight font-semibold text-balance">
        {projets.demarche_title} ({projets.projets.length})
      </h2>
      <ul className="m-0 flex list-none flex-wrap gap-8 p-0">
        {projets.projets.map((projet: Projet, index: number) => (
          <ProjetSection key={index.toString()} projet={projet} />
        ))}
      </ul>
    </li>
  );
}
