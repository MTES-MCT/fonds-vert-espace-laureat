import type { DemoSourceState } from "@/utils/demo/anomalies";
import type { ProjectView } from "@/utils/projectView";

export function readDemoView(value: unknown): ProjectView {
  return value === "instructeur" ? "instructeur" : "porteur";
}

export function demoUrl(
  path: string,
  view: ProjectView,
  sourceState?: DemoSourceState,
) {
  const query = new URLSearchParams();
  if (view === "instructeur") query.set("vue", view);
  if (sourceState && sourceState !== "initial")
    query.set("fondsVert", sourceState);
  return query.size ? `${path}?${query}` : path;
}
