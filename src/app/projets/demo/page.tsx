import DossiersTable from "@/app/projets/_components/DossiersTable";
import type { SearchParams } from "@/app/projets/_components/getParams";
import { DemoToolsPanel } from "@/app/projets/demo/DemoToolsPanel";
import { demoUrl, readDemoView } from "@/app/projets/demo/navigation";
import { StartDsfrOnHydration } from "@/components/dsfr";
import { getDossiersProgress } from "@/db/dossierProgress";
import { demoProjects } from "@/utils/demo/catalogue";
import { projectListLabel } from "@/utils/projectView";

export default async function DemoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  const view = readDemoView(query.vue);
  const projects = demoProjects(view);
  const progress = await getDossiersProgress({
    dossierNumbers: projects.map(({ dossier }) => dossier.numero),
  });

  for (const { dossier, status } of projects) {
    if (progress[dossier.numero].revision === 0)
      progress[dossier.numero] = { ...progress[dossier.numero], status };
  }

  return (
    <>
      <StartDsfrOnHydration />
      <div className="fr-container py-8">
        <h1>{projectListLabel(view)}</h1>
        <DossiersTable
          dossiers={projects.map(({ dossier }) => dossier)}
          view={view}
          summaries={Object.fromEntries(
            projects.map(({ dossier, fondsVert, signals }) => [
              dossier.numero,
              {
                numeroDossier: dossier.numero,
                socleCommun: fondsVert.socle_commun ?? null,
                signals,
              },
            ]),
          )}
          progress={progress}
          projectLink={(number, impact) =>
            demoUrl(`/projets/demo/${number}${impact ? "/impact" : ""}`, view) +
            (impact ? "#signalements" : "")
          }
        />
      </div>
      <DemoToolsPanel view={view} switchPath="/projets/demo" />
    </>
  );
}
