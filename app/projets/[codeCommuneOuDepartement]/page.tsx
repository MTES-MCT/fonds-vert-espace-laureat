import { ProjetsPanel } from "@/app/projets/_components/ProjetsPanel";
import { TabButton } from "@/app/projets/_components/TabButton";
import { communeEtDepartements, projetsGroupes } from "@/utils/projets";

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
