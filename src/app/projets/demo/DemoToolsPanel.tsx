import { DemoResetButton } from "@/app/projets/demo/DemoResetButton";
import { DemoSourceControl } from "@/app/projets/demo/DemoSourceControl";
import { demoUrl } from "@/app/projets/demo/navigation";
import type { DemoSourceState } from "@/utils/demo/anomalies";
import type { ProjectView } from "@/utils/projectView";

export function DemoToolsPanel({
  state,
  view,
  switchPath,
}: {
  state?: DemoSourceState;
  view: ProjectView;
  switchPath: string;
}) {
  const instructor = view === "instructeur";

  return (
    <aside
      aria-label="Outils de démonstration"
      className={`
        fixed right-4 bottom-4 z-[750] w-72 max-w-[calc(100vw-2rem)] border
        border-[var(--border-default-grey)] bg-[var(--background-default-grey)] shadow-lg
      `}
    >
      <details>
        <summary className="cursor-pointer px-4 py-3 font-bold">
          Démonstration{instructor ? " · Instructeur" : " · Porteur"}
        </summary>
        <div className="flex max-h-[60dvh] flex-col items-start gap-3 overflow-y-auto px-4 pb-4">
          <a
            className="fr-link"
            href={demoUrl(
              switchPath,
              instructor ? "porteur" : "instructeur",
              state,
            )}
          >
            {instructor ? "Passer en vue porteur" : "Passer en vue instructeur"}
          </a>
          {state && <DemoSourceControl state={state} />}
          <p className="mb-0 text-sm">
            Les modifications et la réinitialisation s’appliquent à tous les
            visiteurs.
          </p>
          <DemoResetButton />
        </div>
      </details>
    </aside>
  );
}
