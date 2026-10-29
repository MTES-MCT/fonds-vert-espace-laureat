export type ProjectView = "porteur" | "instructeur";

export function isProjectView(value: unknown): value is ProjectView {
  return value === "porteur" || value === "instructeur";
}

export function projectListLabel(view?: ProjectView): string {
  if (view === "porteur") return "Mes projets";
  if (view === "instructeur") return "Projets suivis";
  return "Projets";
}
