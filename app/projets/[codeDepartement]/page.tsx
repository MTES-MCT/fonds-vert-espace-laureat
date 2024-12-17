import {
  getSearchParams,
  SearchParams,
} from "@/app/projets/_components/getParams";
import { ProjetsPanel } from "@/app/projets/_components/ProjetsPanel";
import { TabButton } from "@/app/projets/_components/TabButton";
import {
  communesEtDepartements,
  projetsParCommunesAnneesDemarches,
  projetsParDepartementsAnneesDemarches,
} from "@/utils/projets";

export default async function ProjetsDepartement({
  params,
  searchParams,
}: {
  params: Promise<{ codeDepartement: string }>;
  searchParams: SearchParams;
}) {
  const { codeDepartement } = await params;
  const { codeCommune } = await getSearchParams({ searchParams });

  if (!projetsParDepartementsAnneesDemarches[codeDepartement]) {
    return <h1>Département introuvable</h1>;
  }

  const projetsGroupe = codeCommune
    ? projetsParCommunesAnneesDemarches[codeCommune]
    : projetsParDepartementsAnneesDemarches[codeDepartement];

  const projetsParDemarches2023 = projetsGroupe[2023];
  const projetsParDemarches2024 = projetsGroupe[2024];

  return (
    <div>
      <h1 className="mb-4">{communesEtDepartements[codeDepartement]}</h1>
      <div className="fr-tabs">
        <ul
          className="fr-tabs__list"
          role="tablist"
          aria-label="Projets par année"
        >
          <TabButton selected={true} annee={2024} />
          <TabButton selected={false} annee={2023} />
        </ul>
        <ProjetsPanel
          selected={true}
          annee={2024}
          projetsParDemarches={projetsParDemarches2024}
        />
        <ProjetsPanel
          selected={false}
          annee={2023}
          projetsParDemarches={projetsParDemarches2023}
        />
      </div>
    </div>
  );
}
