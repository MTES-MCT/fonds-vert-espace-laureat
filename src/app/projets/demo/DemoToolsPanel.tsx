import { DemoResetButton } from "@/app/projets/demo/DemoResetButton";
import { DemoSourceControl } from "@/app/projets/demo/DemoSourceControl";
import type { DemoSourceState } from "@/utils/demo/anomalies";

export function DemoToolsPanel({ state }: { state: DemoSourceState }) {
  return (
    <aside
      aria-label="Outils de démonstration"
      className={`
        fixed right-4 bottom-4 z-[750] w-72 max-w-[calc(100vw-2rem)] border
        border-[var(--border-default-grey)] bg-white shadow-lg
      `}
    >
      <details open>
        <summary className="cursor-pointer px-4 py-3 font-bold">
          Démonstration
        </summary>
        <div className="space-y-4 px-4 pb-4">
          <DemoSourceControl state={state} />
          <DemoResetButton />
        </div>
      </details>
    </aside>
  );
}
