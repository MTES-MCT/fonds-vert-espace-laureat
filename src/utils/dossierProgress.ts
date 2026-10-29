export const DOSSIER_PROGRESS_STATUSES = [
  "Non-commencé",
  "En cours de réalisation",
  "Bloqué",
  "Abandonné",
  "Terminé",
] as const;

export type DossierProgressStatus = (typeof DOSSIER_PROGRESS_STATUSES)[number];

export function isDossierProgressStatus(
  value: unknown,
): value is DossierProgressStatus {
  return (
    typeof value === "string" &&
    DOSSIER_PROGRESS_STATUSES.some((status) => status === value)
  );
}

export function requiresProgressConfirmation(
  status: DossierProgressStatus,
): boolean {
  return status === "Terminé" || status === "Abandonné";
}
