export type SearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

export async function getSearchParams({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { siret: siretParams, dossier: dossierParams } = await searchParams;

  return {
    siret: getSiretValue(siretParams),
    dossierNumbers: getDossiersValue(dossierParams),
  };
}

function getSiretValue(siret: string | string[] | undefined) {
  if (typeof siret === "string") {
    return siret;
  }

  if (Array.isArray(siret)) {
    return siret[0];
  }

  return undefined;
}

function getDossiersValue(dossiers: string | string[] | undefined): number[] {
  const dossierArray = Array.isArray(dossiers) ? dossiers : [dossiers];

  return dossierArray
    .map((dossier) => Number(dossier))
    .filter((num) => !isNaN(num));
}
