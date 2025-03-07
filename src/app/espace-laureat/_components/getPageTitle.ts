export function getPageTitle({
  successDossiersLength,
}: {
  successDossiersLength: number;
}): string {
  if (successDossiersLength === 0) {
    return "Aucun dossier";
  }

  if (successDossiersLength === 1) {
    return "Dossier accepté";
  }

  return "Dossiers acceptés";
}
